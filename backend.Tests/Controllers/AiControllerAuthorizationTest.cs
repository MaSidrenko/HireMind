using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Moq;

namespace backend.Tests;

public class AiControllerAuthorizationTest
{
	private readonly TestApplicationFactory _factory = new();
	[Fact]
	public async Task GenerateBrief_WhenUserIsNotAuthenticated_ReturnsUnauthorized()
	{
		HttpClient client = _factory.CreateClient();
		
		var request = new GenerateAiBriefRequest
		{
			Title = "test",
			Category = "Test",
			RawDescription = "Test"
		};

		HttpResponseMessage response = await client.PostAsJsonAsync(
			"/api/v1/ai/briefs/generate",
			request
		);

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.AiServiceMock.Verify(
			x => x.GenerateAiBriefAsync(
				It.IsAny<int>(),
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task GenerateBrief_WhenUserIsAuthenticatedButHasHoRole_ReturnsForbidden()
	{
		HttpClient client = CreateAuthorizedClientWithoutRole();

		var request = new GenerateAiBriefRequest
		{
			Title = "test",
			Category = "Test",
			RawDescription = "Test"
		};

		HttpResponseMessage response = await client.PostAsJsonAsync(
			"/api/v1/ai/briefs/generate",
			request
		);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.AiServiceMock.Verify(
			x => x.GenerateAiBriefAsync(
				It.IsAny<int>(),
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Theory]
	[MemberData(nameof(RolesExceptClient))]
	public async Task GenerateAiBrief_WhenUserIsNotClient_ReturnForbidden(Role role)
	{
		HttpClient client = CreateAuthorizedClient(role);

		var request = new GenerateAiBriefRequest
		{
			Title = "test",
			Category = "Test",
			RawDescription = "Test"
		};

		HttpResponseMessage response = await client.PostAsJsonAsync(
			"/api/v1/ai/briefs/generate",
			request
		);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.AiServiceMock.Verify(
			x => x.GenerateAiBriefAsync(
				42,
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task GenerateAiBrief_WhenUserRoleIsClient_ReturnsOk()
	{
		const int userId = 1;

		HttpClient client = CreateAuthorizedClient(Role.Client, userId);

		var request = new GenerateAiBriefRequest
		{
			Title = "test",
			Category = "Test",
			RawDescription = "Test"
		};

		AiBriefResult BriefResult = CreateAiBriefResult("Summary for AI");

		_factory.AiServiceMock
			.Setup(x => x.GenerateAiBriefAsync(
				userId,
				It.Is<GenerateAiBriefRequest>(r => 
				r.Title == request.Title &&
				r.Category == request.Category &&
				r.RawDescription == request.RawDescription),
				It.IsAny<CancellationToken>()
			)).ReturnsAsync(BriefResult);

		HttpResponseMessage response = await client.PostAsJsonAsync(
			"/api/v1/ai/briefs/generate",
			request
		);

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.AiServiceMock.Verify(
			x => x.GenerateAiBriefAsync(
				userId,
				It.Is<GenerateAiBriefRequest>(r => 
				r.Title == request.Title &&
				r.Category == request.Category &&
				r.RawDescription == request.RawDescription),
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}
	[Fact]
	public async Task ProjectAssistant_WhenUserIsNotAuthenticated_ReturnsUnauthorized()
	{
		HttpClient client = _factory.CreateClient();

		var request = new ProjectAssistantRequest
		{
			ProjectId = 1,
			Prompt = "Test"
		};

		HttpResponseMessage response = await client.PostAsJsonAsync(
			"/api/v1/ai/project-assistant",
			request
		);

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.AiServiceMock.Verify(
			x => x.ResponesToAi(
				It.IsAny<int>(),
				It.IsAny<int>(),
				request.Prompt,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task ProjectAssistant_WhenUserIsAuthenticatedButHasNoRole_ReturnsForbidden()
	{
		HttpClient client = CreateAuthorizedClientWithoutRole();

		var request = new ProjectAssistantRequest
		{
			ProjectId = 1,
			Prompt = "Test"
		};

		HttpResponseMessage response = await client.PostAsJsonAsync(
			"/api/v1/ai/project-assistant",
			request
		);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.AiServiceMock.Verify(
			x => x.ResponesToAi(
				It.IsAny<int>(),
				It.IsAny<int>(),
				request.Prompt,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Theory]
	[MemberData(nameof(RolesExceptClient))]
	public async Task ProjectAssistant_WhenUserIsNotClient_RetrunForbidden(Role role)
	{
		HttpClient client = CreateAuthorizedClient(role, 1);

		var request = new ProjectAssistantRequest
		{
			ProjectId = 1,
			Prompt = "Test"
		};

		HttpResponseMessage response = await client.PostAsJsonAsync(
			"/api/v1/ai/project-assistant",
			request
		);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.AiServiceMock.Verify(
			x => x.ResponesToAi(
				request.ProjectId,
				1,
				request.Prompt,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task ProjectAssistan_WhenUserRoleIsClient_ReturnsOk()
	{
		const int userId = 1;

		HttpClient client = CreateAuthorizedClient(Role.Client, userId);

		var request = new ProjectAssistantRequest
		{
			ProjectId = 1,
			Prompt = "Test"
		};

		AskAiResponse askAiResponse = new()
		{
			Answer = "Test Answer"
		};
		
		_factory.AiServiceMock
			.Setup(x => x.ResponesToAi(
				It.Is<int>(r => r == request.ProjectId),
				userId,
				It.Is<string>(r => r == request.Prompt),
				It.IsAny<CancellationToken>()
			)).ReturnsAsync(askAiResponse);

		HttpResponseMessage response = await client.PostAsJsonAsync(
			"/api/v1/ai/project-assistant",
			request
		);

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.AiServiceMock.Verify(
			x => x.ResponesToAi(
				It.Is<int>(r => r == request.ProjectId),
				userId,
				It.Is<string>(r => r == request.Prompt),
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}
	public static IEnumerable<object[]> RolesExceptClient()
	{
		return Enum
			.GetValues<Role>()
			.Where(role => role != Role.Client)
			.Select(role => new object[] { role });
	}

	private AiBriefResult CreateAiBriefResult(string summary)
	{
		return new AiBriefResult
		{
			Summary = summary,
			BriefSections = new BriefSectionsDto
			{
				Goal = "Test goal",
				Audience = "Test audience",
				Screens = "Test screens",
				Features = "Test features",
				Content = "Test content",
				Design = "Test design",
				Constraints = "Test constraints",
				OpenQuestions = "Test open questions"
			},
			Questions =
			[
				new ClarificationQuestionDto
				{
					Id = 1,
					Question = "Test question",
					Importance = RiskLevel.medium,
					Answer = "Test answer",
					Options = ["Option 1", "Option 2"]
				}
			],
			ScopeItems =
			[
				new ScopeItemDto
				{
					Id = 1,
					Title = "Test scope item",
					Description = "Test scope description",
					Bucket = ScopeBucket.included
				}
			],
			DoneCriteria =
			[
				new DoneCriterionDto
				{
					Id = 1,
					Text = "Test done criterion",
					Checked = false
				}
			],
			Risks =
			[
				new RiskItemDto
				{
					Id = 1,
					Title = "Test risk",
					Level = RiskLevel.high,
					Impact = "Test impact",
					Action = "Test action",
					Resolved = false
				}
			]
		};
	}

	private HttpClient CreateAuthorizedClient(Role role, int userId = 42)
	{
		HttpClient client = CreateAuthorizedClientWithoutRole(userId);

		client.DefaultRequestHeaders.Add(TestAuthHandler.RoleHeader, role.ToString());

		return client;
	}

	private HttpClient CreateAuthorizedClientWithoutRole(int userId = 42)
	{
		HttpClient client = _factory.CreateClient();

		client.DefaultRequestHeaders.Authorization =
			new AuthenticationHeaderValue(TestAuthHandler.SchemeName);

		client.DefaultRequestHeaders.Add(TestAuthHandler.UserIdHeader, userId.ToString());

		return client;
	}

}
