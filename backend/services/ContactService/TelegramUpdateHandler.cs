using Telegram.Bot;
using Telegram.Bot.Types;

namespace backend;

public sealed class TelegramUpdateHandler
{
	private readonly ITelegramBotClient _botClient;
	private readonly IServiceScopeFactory _scopeFactory;
	private readonly ILogger<TelegramUpdateHandler> _logger;

	public TelegramUpdateHandler(
		ITelegramBotClient botClient,
		IServiceScopeFactory scopeFactory,
		ILogger<TelegramUpdateHandler> logger)
	{
		_botClient = botClient;
		_scopeFactory = scopeFactory;
		_logger = logger;
	}

	public async Task HandleAsync(Update update, CancellationToken ct)
	{
		if (update.Message?.Text is not string text)
		{
			return;
		}

		long chatId = update.Message.Chat.Id;
		string normalizedText = text.Trim();

		if (normalizedText.StartsWith("/help", StringComparison.OrdinalIgnoreCase))
		{
			await SendTextAsync(
				chatId,
				"Этот бот подключает Telegram к вашему аккаунту HireMind. Нажмите кнопку подключения в профиле и затем команду Start в боте.",
				ct
			);
			return;
		}

		if (!normalizedText.StartsWith("/start", StringComparison.OrdinalIgnoreCase))
		{
			return;
		}

		string? rawToken = ExtractStartToken(normalizedText);

		if (string.IsNullOrWhiteSpace(rawToken))
		{
			await SendTextAsync(
				chatId,
				"Бот готов к подключению. Вернитесь в профиль HireMind, нажмите кнопку подключения Telegram и затем снова нажмите Start по ссылке.",
				ct
			);
			return;
		}

		using IServiceScope scope = _scopeFactory.CreateScope();
		ITelegramService telegramService = scope.ServiceProvider.GetRequiredService<ITelegramService>();

		TelegramLinkConsumeResult result = await telegramService.ConsumeLinkTokenAsync(
			rawToken,
			chatId,
			update.Message.From?.Username
		);

		if (result.IsSuccess)
		{
			await SendTextAsync(
				chatId,
				"Telegram успешно подключён. Теперь уведомления HireMind будут приходить сюда.",
				ct
			);
			return;
		}

		_logger.LogWarning("Telegram link consume failed for chat {ChatId}: {Error}", chatId, result.ErrorMessage);

		await SendTextAsync(
			chatId,
			result.ErrorMessage ?? "Не удалось подключить Telegram. Создайте новую ссылку в профиле и попробуйте снова.",
			ct
		);
	}

	private async Task SendTextAsync(long chatId, string text, CancellationToken ct)
	{
		await _botClient.SendMessage(chatId, text, cancellationToken: ct);
	}

	private static string? ExtractStartToken(string text)
	{
		string[] parts = text.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

		if (parts.Length < 2)
		{
			return null;
		}

		return parts[1];
	}
}
