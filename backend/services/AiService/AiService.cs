using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;

namespace backend;

public class AiService : IAiService
{
	private static readonly JsonSerializerOptions BriefJsonOptions = new()
	{
		PropertyNameCaseInsensitive = true,
		Converters = { new JsonStringEnumConverter(allowIntegerValues: false) }
	};

	private const string ProjectAssistantPromptVersion = "project_assistant_v1";
	private const string BriefGenerationPromptVersion = "brief_generation_v1";

	private IHttpClientFactory _httpClientFactory;
	private IOrderService _orderService;
	private AppDbContext _db;
	public AiService(IHttpClientFactory httpClientFactory, IOrderService orderService, AppDbContext db)
	{
		_httpClientFactory = httpClientFactory;
		_orderService = orderService;
		_db = db;
	}

	public async Task<AiBriefResult> GenerateAiBriefAsync(int ownerId, GenerateAiBriefRequest request, CancellationToken ct = default)
	{
		var client = _httpClientFactory.CreateClient("GroqAPI");
		string model = Environment.GetEnvironmentVariable("GROQ_MODEL")
	    			?? "qwen/qwen3-32b";
		string systemPrompt = BuildBriefGenerationSystemPrompt();
		string userPrompt = BuildBriefGenerationUserPrompt(request);

		ChatCompletionRequest aiRequest = new()
		{
			Model = model,
			Messages = [
				new ChatMessage
				{
					Role = "system",
					Content = systemPrompt
				},
				new ChatMessage
				{
					Role = "user",
					Content = userPrompt
				}
			]
		};

		HttpResponseMessage response = await client.PostAsJsonAsync(
			"chat/completions",
			aiRequest,
			ct
		);

		if(!response.IsSuccessStatusCode)
		{
			string errorBody = await response.Content.ReadAsStringAsync(ct);
			throw new AiRequestFailedException((int)response.StatusCode, errorBody);
		}

		ChatCompletionResponse? aiResponse = await response.Content.ReadFromJsonAsync<ChatCompletionResponse>(cancellationToken: ct);

		string? answer = aiResponse?
			.Choices?
			.FirstOrDefault()?
			.Message?
			.Content;

		if(string.IsNullOrWhiteSpace(answer))
		{
			throw new AiInvalidResponseException();
		}

		string cleanedAnswer = CleanAssistantOutput(answer);
		AiBriefResult result = ParseAiBriefResult(cleanedAnswer);

		AiConversation conversation = await GetOrCreateConversationAsync(
			null,
			ownerId,
			ConversationType.brief_generation,
			ct);
		await SaveConversationMessagesAsync(
			conversation,
			ownerId,
			systemPrompt,
			userPrompt,
			cleanedAnswer,
			BriefGenerationPromptVersion,
			ct);

		return result;
	}

	public async Task<AskAiResponse> ResponesToAi(int orderId,int ownerId, string userMessage, CancellationToken ct = default)
	{
		Order order = await _orderService.GetByIdAsync(orderId, ct);

		if(order.CustomerId != ownerId)
		{
			throw new OrderAccessDeniedException(orderId);
		}

		var client = _httpClientFactory.CreateClient("GroqAPI");
		string model = Environment.GetEnvironmentVariable("GROQ_MODEL")
	    			?? "qwen/qwen3-32b";
		string messageSystem = BuildSystemPrompt(order);
		ChatCompletionRequest aiRequest = new()
		{
			Model = model,
			Messages = [
				new ChatMessage {
					Role = "system",
					Content = messageSystem
				},
				new ChatMessage {
					Role = "user",
					Content = userMessage
				}
			]	
		};
		HttpResponseMessage response = await client.PostAsJsonAsync(
			"chat/completions",
			aiRequest,
			ct
		);

		if(!response.IsSuccessStatusCode)
		{
			string errorBody = await response.Content.ReadAsStringAsync(ct);
			throw new AiRequestFailedException((int)response.StatusCode, errorBody);
		}

		ChatCompletionResponse? aiResponse = await response.Content.ReadFromJsonAsync<ChatCompletionResponse>(cancellationToken: ct);

		string? answer = aiResponse?
			.Choices?
			.FirstOrDefault()?
			.Message?
			.Content;

		if(string.IsNullOrWhiteSpace(answer))
			throw new AiInvalidResponseException();

		answer = CleanAssistantOutput(answer);

		AiConversation conversation = await GetOrCreateConversationAsync(
			orderId,
			ownerId,
			ConversationType.project_assistant,
			ct);
		await SaveConversationMessagesAsync(
			conversation,
			ownerId,
			messageSystem,
			userMessage,
			answer,
			ProjectAssistantPromptVersion,
			ct);

		return new AskAiResponse
		{
			Answer = answer
		};
	}

	private async Task<AiConversation> GetOrCreateConversationAsync(
		int? orderId,
		int ownerId,
		ConversationType conversationType,
		CancellationToken ct)
	{
		AiConversation? conversation = await _db.AiConversations
			.FirstOrDefaultAsync(
				item => item.OrderId == orderId
					&& item.CreatedByUserId == ownerId
					&& item.ConversationType == conversationType,
				ct);

		if (conversation is not null)
		{
			return conversation;
		}

		conversation = new AiConversation
		{
			OrderId = orderId,
			CreatedByUserId = ownerId,
			ConversationType = conversationType
		};

		_db.AiConversations.Add(conversation);
		return conversation;
	}

	private async Task SaveConversationMessagesAsync(
		AiConversation conversation,
		int ownerId,
		string systemPrompt,
		string userMessage,
		string assistantAnswer,
		string promptVersion,
		CancellationToken ct)
	{
		conversation.Messages.Add(new AiMessage
		{
			AuthorUserId = null,
			MessageRole = MessageRoleAi.system,
			Content = systemPrompt,
			PromptVersion = promptVersion
		});

		conversation.Messages.Add(new AiMessage
		{
			AuthorUserId = ownerId,
			MessageRole = MessageRoleAi.user,
			Content = userMessage,
			PromptVersion = promptVersion
		});

		conversation.Messages.Add(new AiMessage
		{
			AuthorUserId = null,
			MessageRole = MessageRoleAi.assistant,
			Content = assistantAnswer,
			PromptVersion = promptVersion
		});

		await _db.SaveChangesAsync(ct);
	}

	private static string BuildBriefGenerationSystemPrompt()
	{
		return """
			Ты AI-ассистент платформы HireMind для заказчиков.

			Твоя задача:
			проанализировать сырой запрос заказчика и вернуть структурированный черновик брифа.

			Правила:
			- Отвечай только на русском языке.
			- Не используй теги <think>.
			- Не добавляй пояснения, комментарии или markdown вне JSON.
			- Верни только один JSON-объект.
			- Если данных не хватает, заполни секции максимально полезно, но не выдумывай конкретику без опоры на входные данные.
			- Для вопросов добавляй только реально полезные уточнения.
			- Для рисков добавляй только существенные риски.
			- Поля importance и level должны быть только: low, medium, high.

			Структура JSON:
			{
			  "summary": "string",
			  "briefSections": {
			    "goal": "string",
			    "audience": "string",
			    "screens": "string",
			    "features": "string",
			    "content": "string",
			    "design": "string",
			    "constraints": "string",
			    "openQuestions": "string"
			  },
			  "questions": [
			    {
			      "question": "string",
			      "importance": "low | medium | high",
			      "answer": "",
			      "options": ["string"]
			    }
			  ],
			  "risks": [
			    {
			      "title": "string",
			      "level": "low | medium | high",
			      "impact": "string",
			      "action": "string",
			      "resolved": false
			    }
			  ]
			}
			""";
	}

	private static string BuildBriefGenerationUserPrompt(GenerateAiBriefRequest request)
	{
		return $"""
			Сгенерируй черновик брифа для нового проекта.

			Название: {request.Title}
			Категория: {request.Category}
			Сырой запрос заказчика:
			{request.RawDescription}
			""";
	}

	private static string BuildSystemPrompt(Order order)
	{
		return $$"""
			Ты AI-ассистент платформы HireMind для заказчиков.

			Твоя задача:
			помогать заказчику уточнять, анализировать и улучшать проект, бриф и техническое задание на основе переданного контекста проекта.

			Правила работы:
			- Отвечай только на русском языке.
			- Не показывай внутренние рассуждения.
			- Не используй теги <think> и не упоминай скрытый ход мыслей.
			- Не выдумывай факты, которых нет в контексте проекта.
			- Если данных недостаточно, прямо скажи, чего не хватает.
			- Учитывай только переданный контекст проекта и текущий вопрос пользователя.
			- Не отвечай общими абстрактными советами, если можно дать прикладной ответ по проекту.
			- Если пользователь просит улучшить формулировку, возвращай готовый текст, который можно сразу использовать.
			- Если видишь противоречия, риски или пробелы в проекте, укажи их явно.
			- Если вопрос широкий, структурируй ответ короткими логичными блоками.
			- Если уместно, в конце дай 1-3 конкретных следующих шага.
			- Не добавляй дисклеймеры про то, что ты ИИ, если тебя об этом не спрашивают.

			Формат ответа:
			- Кратко, по делу, без воды.
			- По умолчанию 1-6 абзацев или короткий список.
			- Если пользователь просит переписать или составить текст, сначала дай готовый вариант.
			- Если для точного ответа не хватает данных, сначала ответь по доступному контексту, затем перечисли, что нужно уточнить.

			Контекст проекта:
			{{BuildProjectContext(order)}}

			Текущий вопрос пользователя будет передан отдельным user-сообщением. Отвечай именно на него, опираясь на контекст проекта выше.
			""";
	}

	private static AiBriefResult ParseAiBriefResult(string assistantOutput)
	{
		try
		{
			string json = ExtractJsonPayload(assistantOutput);
			AiBriefResult? result = JsonSerializer.Deserialize<AiBriefResult>(json, BriefJsonOptions);

			if (result is null)
			{
				throw new AiInvalidResponseException("AI вернул пустой JSON для брифа.", "ai_invalid_brief_response");
			}

			result.Summary = ValueOrFallbackForBrief(result.Summary);
			result.BriefSections ??= new BriefSectionsDto();
			result.Questions ??= new List<ClarificationQuestionDto>();
			result.Risks ??= new List<RiskItemDto>();

			for (int i = 0; i < result.Questions.Count; i++)
			{
				result.Questions[i].Id = i + 1;
				result.Questions[i].Answer ??= string.Empty;
				result.Questions[i].Options ??= new List<string>();
			}

			for (int i = 0; i < result.Risks.Count; i++)
			{
				result.Risks[i].Id = i + 1;
			}

			return result;
		}
		catch (JsonException)
		{
			throw new AiInvalidResponseException("AI вернул невалидный JSON для брифа.", "ai_invalid_brief_response");
		}
	}

	private static string ExtractJsonPayload(string assistantOutput)
	{
		string cleaned = assistantOutput.Trim();

		if (cleaned.StartsWith("```", StringComparison.Ordinal))
		{
			cleaned = Regex.Replace(cleaned, @"^```(?:json)?\s*", "", RegexOptions.IgnoreCase);
			cleaned = Regex.Replace(cleaned, @"\s*```$", "");
		}

		return cleaned.Trim();
	}

	private static string BuildProjectContext(Order order)
	{
		StringBuilder builder = new();

		builder.AppendLine($"ID проекта: {order.Id}");
		builder.AppendLine($"Заголовок: {ValueOrFallback(order.Title)}");
		builder.AppendLine($"Описание: {ValueOrFallback(order.Description)}");
		builder.AppendLine($"Техническое задание: {ValueOrFallback(order.TechnicalSpecification)}");
		builder.AppendLine($"Категория: {order.Category}");
		builder.AppendLine($"Этап проекта: {order.WorkflowStage}");
		builder.AppendLine($"AI-generated: {(order.AiGenerated ? "да" : "нет")}");
		builder.AppendLine($"Readiness score: {order.ReadinessScore}");
		builder.AppendLine($"Навыки: {FormatList(order.Skills)}");

		if (order.BriefSections is not null)
		{
			builder.AppendLine("Секции брифа:");
			builder.AppendLine($"- Goal: {ValueOrFallback(order.BriefSections.Goal)}");
			builder.AppendLine($"- Audience: {ValueOrFallback(order.BriefSections.Audience)}");
			builder.AppendLine($"- Screens: {ValueOrFallback(order.BriefSections.Screens)}");
			builder.AppendLine($"- Features: {ValueOrFallback(order.BriefSections.Features)}");
			builder.AppendLine($"- Content: {ValueOrFallback(order.BriefSections.Content)}");
			builder.AppendLine($"- Design: {ValueOrFallback(order.BriefSections.Design)}");
			builder.AppendLine($"- Constraints: {ValueOrFallback(order.BriefSections.Constraints)}");
			builder.AppendLine($"- Open questions: {ValueOrFallback(order.BriefSections.OpenQuestions)}");
		}

		builder.AppendLine("Уточняющие вопросы:");
		if (order.ClarificationQuestions.Count == 0)
		{
			builder.AppendLine("- Нет");
		}
		else
		{
			foreach (ClarificationQuestion question in order.ClarificationQuestions)
			{
				builder.AppendLine($"- [{question.Importance}] Вопрос: {ValueOrFallback(question.Question)}");
				builder.AppendLine($"  Ответ: {ValueOrFallback(question.Answer)}");
				builder.AppendLine($"  Варианты: {FormatList(question.Options)}");
			}
		}

		builder.AppendLine("Scope:");
		if (order.ScopeItems.Count == 0)
		{
			builder.AppendLine("- Нет");
		}
		else
		{
			foreach (ScopeItem scopeItem in order.ScopeItems)
			{
				builder.AppendLine($"- [{scopeItem.Bucket}] {ValueOrFallback(scopeItem.Title)}: {ValueOrFallback(scopeItem.Description)}");
			}
		}

		builder.AppendLine("Критерии готовности:");
		if (order.DoneCriteria.Count == 0)
		{
			builder.AppendLine("- Нет");
		}
		else
		{
			foreach (DoneCriterion doneCriterion in order.DoneCriteria)
			{
				builder.AppendLine($"- [{(doneCriterion.Checked ? "готово" : "не готово")}] {ValueOrFallback(doneCriterion.Text)}");
			}
		}

		builder.AppendLine("Риски:");
		if (order.Risks.Count == 0)
		{
			builder.AppendLine("- Нет");
		}
		else
		{
			foreach (RiskItem risk in order.Risks)
			{
				builder.AppendLine($"- [{risk.Level}] {ValueOrFallback(risk.Title)}");
				builder.AppendLine($"  Impact: {ValueOrFallback(risk.Impact)}");
				builder.AppendLine($"  Action: {ValueOrFallback(risk.Action)}");
				builder.AppendLine($"  Resolved: {(risk.Resolved ? "да" : "нет")}");
			}
		}

		return builder.ToString().Trim();
	}

	private static string FormatList(IEnumerable<string>? items)
	{
		if (items is null)
		{
			return "Нет";
		}

		List<string> values = items
			.Where(item => !string.IsNullOrWhiteSpace(item))
			.Select(item => item.Trim())
			.ToList();

		return values.Count == 0 ? "Нет" : string.Join(", ", values);
	}

	private static string ValueOrFallback(string? value)
	{
		return string.IsNullOrWhiteSpace(value) ? "Нет данных" : value.Trim();
	}

	private static string ValueOrFallbackForBrief(string? value)
	{
		return string.IsNullOrWhiteSpace(value) ? "AI подготовил черновик брифа для проекта." : value.Trim();
	}

	private static string CleanAssistantOutput(string answer)
	{
		return Regex.Replace(
	    		answer,
	    		@"<think>.*?</think>\s*",
	    		"",
	    		RegexOptions.Singleline
			).Trim();
	}
}
