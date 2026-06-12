using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using MyApp.Namespace;

namespace backend.Tests;

public class AiControllerTests
{
	private readonly Mock<IAiService> _aiService = new(MockBehavior.Strict);

	[Fact]
	public async Task GenerateBrief_WhenUserIdClaimsIsMissing_ReturnsUnauthorized()
	{
		AiController controller = CreateControllerWithoutUser();
		var request = new GenerateAiBriefRequest
		{
			Title = "Test",
			Category = "Testing",
			RawDescription = "Test testing cat"
		};

		IActionResult result = await controller.GenerateBrief(request, CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_aiService.Verify(
			x => x.GenerateAiBriefAsync(
				It.IsAny<int>(),
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task GenerateBrief_WhenUserIdClaimIsNotInteger_ReturnsUnauthorized()
	{
		AiController controller = CreateControllerWithUserIdClaim("abc");
		var request = new GenerateAiBriefRequest
		{
			Title = "Test",
			Category = "Testing",
			RawDescription = "Test testing cat"
		};

		IActionResult result = await controller.GenerateBrief(request, CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_aiService.Verify(
			x => x.GenerateAiBriefAsync(
				It.IsAny<int>(),
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task GenerateBrief_WhenRequestFieldIsNull_ReturnsBadRequest()
	{
		AiController controller = CreateController(1);

		var request = new GenerateAiBriefRequest
		{
			Title = string.Empty,
			Category = string.Empty,
			RawDescription = string.Empty
		};

		IActionResult result = await controller.GenerateBrief(request, CancellationToken.None);

		BadRequestObjectResult badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;

		badRequest.Value.Should().BeEquivalentTo(new
		{
			message = "Title, category and rawDescription are required."
		});

		_aiService.Verify(
			x => x.GenerateAiBriefAsync(
				1,
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task GenerateBrief_WhenRequestFieldTitleIsEmpty_ReturnsBadRequest()
	{
		AiController controller = CreateController(1);

		var request = new GenerateAiBriefRequest
		{
			Title = string.Empty,
			Category = "test",
			RawDescription ="test"
		};

		IActionResult result = await controller.GenerateBrief(request, CancellationToken.None);

		BadRequestObjectResult badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;

		badRequest.Value.Should().BeEquivalentTo(new
		{
			message = "Title, category and rawDescription are required."
		});

		_aiService.Verify(
			x => x.GenerateAiBriefAsync(
				1,
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task GenerateBrief_WhenRequestFieldCategoryIsEmpty_ReturnsBadRequest()
	{
		AiController controller = CreateController(1);

		var request = new GenerateAiBriefRequest
		{
			Title = "Test",
			Category = string.Empty,
			RawDescription = "Test"
		};

		IActionResult result = await controller.GenerateBrief(request, CancellationToken.None);

		BadRequestObjectResult badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;

		badRequest.Value.Should().BeEquivalentTo(new
		{
			message = "Title, category and rawDescription are required."
		});

		_aiService.Verify(
			x => x.GenerateAiBriefAsync(
				1,
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task GenerateBrief_WhenRequestFieldRawDescriptionIsEmpty_ReturnsBadRequest()
	{
		AiController controller = CreateController(1);

		var request = new GenerateAiBriefRequest
		{
			Title = "Test",
			Category = "TEst",
			RawDescription = string.Empty
		};

		IActionResult result = await controller.GenerateBrief(request, CancellationToken.None);

		BadRequestObjectResult badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;

		badRequest.Value.Should().BeEquivalentTo(new
		{
			message = "Title, category and rawDescription are required."
		});

		_aiService.Verify(
			x => x.GenerateAiBriefAsync(
				1,
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task GenerateBrief_WhenRequestIsOk_ReturnOkWithAiBriefResult()
	{
		AiController controller = CreateController(1);

		var request = new GenerateAiBriefRequest
		{
			Title = "Test",
			Category = "Testing",
			RawDescription = "Test testing cat"
		};
		AiBriefResult BriefResult = CreateAiBriefResult("Summary for AI");


		_aiService
			.Setup(x => x.GenerateAiBriefAsync(1, request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(BriefResult);
		
		IActionResult result = await controller.GenerateBrief(request, CancellationToken.None);

		OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;

		ok.Value.Should().BeEquivalentTo(BriefResult);

		_aiService.Verify(
			x => x.GenerateAiBriefAsync(
				1,
				request,
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}
	[Fact]
	public async Task ProjectAssistant_WhenUserIdClaimIsMissing_ReturnsUnauthorized()
	{
		AiController controller = CreateControllerWithoutUser();

		var request = new ProjectAssistantRequest
		{
			ProjectId = 1,
			Prompt = "Test prompt"
		};

		IActionResult result = await controller.ProjectAssistant(request, CancellationToken.None);
	
		result.Should().BeOfType<UnauthorizedResult>();

		_aiService.Verify(
			x => x.ResponesToAi(
				request.ProjectId,
				It.IsAny<int>(),
				request.Prompt,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task ProjectAssistant_WhenUserIdClaimIsNotInteger_ReturnsUnauthorized()
	{
		AiController controller = CreateControllerWithUserIdClaim("abc");

		var request = new ProjectAssistantRequest
		{
			ProjectId = 1,
			Prompt = "Test prompt"
		};

		IActionResult result = await controller.ProjectAssistant(request, CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_aiService.Verify(
			x => x.ResponesToAi(
				request.ProjectId,
				It.IsAny<int>(),
				request.Prompt,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task ProjectAssistant_WhenRequestPromptIsNull_ReturnsBadRequest()
	{
		AiController controller = CreateController(1);

		var request = new ProjectAssistantRequest { 
			Prompt = null! 
		};

		IActionResult result = await controller.ProjectAssistant(request, CancellationToken.None);

		BadRequestObjectResult badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;

		badRequest.Value.Should().BeEquivalentTo(new
		{
			message = "Prompt is required."
		});

		_aiService.Verify(
			x => x.ResponesToAi(
				It.IsAny<int>(),
				1,
				It.IsAny<string>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task ProjectAssistant_WhenRequestPromptIsEmpty_ReturnsBadRequest()
	{
		AiController controller = CreateController(1);

		var request = new ProjectAssistantRequest { 
			Prompt = "" 
		};

		IActionResult result = await controller.ProjectAssistant(request, CancellationToken.None);

		BadRequestObjectResult badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;

		badRequest.Value.Should().BeEquivalentTo(new
		{
			message = "Prompt is required."
		});

		_aiService.Verify(
			x => x.ResponesToAi(
				It.IsAny<int>(),
				1,
				request.Prompt,
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task ProjectAssistant_WhenRequestIsOk_ReturnsOkWithAskAiResponse()
	{
		AiController controller = CreateController(1);

		var request = new ProjectAssistantRequest
		{
			ProjectId = 2,
			Prompt = "Testing"
		};

		AskAiResponse aiResponse = new()
		{
			Answer = "Test answer"
		};

		_aiService
			.Setup(x => x.ResponesToAi(request.ProjectId, 1, request.Prompt, It.IsAny<CancellationToken>()))
			.ReturnsAsync(aiResponse);

		IActionResult result = await controller.ProjectAssistant(request, CancellationToken.None);

		OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;

		ok.Value.Should().BeEquivalentTo(aiResponse);

		_aiService.Verify(
			x => x.ResponesToAi(
				request.ProjectId, 1, request.Prompt, 
				It.IsAny<CancellationToken>()),
			Times.Once
		);
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
	private AiController CreateController(int userId, string? role = null)
	{
		return CreateControllerWithUserIdClaim(userId.ToString(), role);
	}

	private AiController CreateControllerWithUserIdClaim(string userIdClaim, string? role = null)
	{
		var claims = new List<Claim>
		{
			new(ClaimTypes.NameIdentifier, userIdClaim)
		};

		if (role is not null)
		{
			claims.Add(new Claim(ClaimTypes.Role, role));
		}

		var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
		var controller = new AiController(_aiService.Object);

		controller.ControllerContext = new ControllerContext
		{
			HttpContext = new DefaultHttpContext
			{
				User = user
			}
		};

		return controller;
	}

	private AiController CreateControllerWithoutUser()
	{
		var controller = new AiController(_aiService.Object);

		controller.ControllerContext = new ControllerContext
		{
			HttpContext = new DefaultHttpContext
			{
				User = new ClaimsPrincipal(new ClaimsIdentity())
			}
		};

		return controller;
	}
}
