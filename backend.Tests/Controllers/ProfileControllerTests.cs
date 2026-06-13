using System.Reflection;
using System.Security.Claims;
using backend;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using MyApp.Namespace;

namespace backend.Tests.Controllers;

public class ProfileControllerTests
{
	private readonly Mock<IProfileSerivce> _profileService = new(MockBehavior.Strict);
	private readonly Mock<ITelegramLinkService> _telegramService = new(MockBehavior.Strict);
	
	[Fact]
	public async Task UpdateProfile_WhenHourlyRateIsNegative_ReturnsBadRequest()
	{
		ProfileController controller = CreateController(userId: 42);
		var request = new UpdateProfileRequest
		{
			HourlyRate = -100
		};

		IActionResult result = await controller.UpdateProfile(request, CancellationToken.None);

		BadRequestObjectResult badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;

		badRequest.Value.Should().BeEquivalentTo(new
		{
			message = "Почасовая ставка не может быть отрицательной."
		});

		_profileService.Verify(
			x => x.UpdateProfileAsync(
				It.IsAny<UpdateProfileRequest>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()),
			Times.Never);
	}

	[Fact]
	public async Task UpdateProfile_WhenUserIdClaimIsMissing_ReturnsUnauthorized()
	{
		ProfileController controller = CreateControllerWithoutUser();
		var request = new UpdateProfileRequest
		{
			HourlyRate = 1000
		};

		IActionResult result = await controller.UpdateProfile(request, CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_profileService.Verify(
			x => x.UpdateProfileAsync(
				It.IsAny<UpdateProfileRequest>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()),
			Times.Never);
	}

	[Fact]
	public async Task UpdateProfile_WhenRequestIsValid_ReturnsOkWithUserDto()
	{
		ProfileController controller = CreateController(userId: 42);
		var request = new UpdateProfileRequest
		{
			HourlyRate = 1500
		};

		User user = ProfileTestData.CreateFreelancerUser(42);

		_profileService
			.Setup(x => x.UpdateProfileAsync(request, 42, It.IsAny<CancellationToken>()))
			.ReturnsAsync(user);

		IActionResult result = await controller.UpdateProfile(request, CancellationToken.None);

		OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;

		ok.Value.Should().BeEquivalentTo(new
		{
			user = new
			{
				Id = user.Id,
				Email = user.Email,
				FullName = user.FullName,
				Role = user.Role,
				HourlyRate = user.HourlyRate
			}
		});

		_profileService.Verify(
			x => x.UpdateProfileAsync(request, 42, It.IsAny<CancellationToken>()),
			Times.Once);
	}
	[Fact]
	public void UpdateSkills_ShouldAllowOnlyFreelancerRole()
	{
		MethodInfo? method = typeof(ProfileController).GetMethod(nameof(ProfileController.UpdateSkills));

		method.Should().NotBeNull();

		
		AuthorizeAttribute? authorizeAttribute = method!
			.GetCustomAttributes<AuthorizeAttribute>()
			.SingleOrDefault(attribute => attribute.Roles is not null);

		authorizeAttribute.Should().NotBeNull();
		authorizeAttribute!.Roles.Should().Be(nameof(Role.Freelancer));
	}
	[Fact]
	public async Task UpdateSkills_WhenUserIdClaimIsMissing_ReturnsUnauthorized()
	{
		ProfileController controller = CreateControllerWithoutUser();
		var request = new UpdateProfileSkillsRequest
		{
			Skills = ["C#", "ASP.NET Core"]
		};

		IActionResult result = await controller.UpdateSkills(request, CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_profileService.Verify(
			x => x.UpdateSkillsAsync(
				It.IsAny<UpdateProfileSkillsRequest>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()),
			Times.Never);
	}

	[Fact]
	public async Task UpdateSkills_WhenRequestIsValid_ReturnsOkWithUserDto()
	{
		ProfileController controller = CreateController(userId: 42);
		var request = new UpdateProfileSkillsRequest
		{
			Skills = ["C#", "ASP.NET Core"]
		};

		User user = ProfileTestData.CreateFreelancerUser(42);

		_profileService
			.Setup(x => x.UpdateSkillsAsync(request, 42, It.IsAny<CancellationToken>()))
			.ReturnsAsync(user);

		IActionResult result = await controller.UpdateSkills(request, CancellationToken.None);

		OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;

		ok.Value.Should().BeEquivalentTo(new
		{
			user = new
			{
				Id = user.Id,
				Email = user.Email,
				FullName = user.FullName,
				Skills = user.Skills
			}
		});

		_profileService.Verify(
			x => x.UpdateSkillsAsync(request, 42, It.IsAny<CancellationToken>()),
			Times.Once);
	}

	[Fact]
	public async Task CreateTelegramConnectLink_WhenUserIdClaimIsMissing_ReturnsUnauthorized()
	{
		ProfileController controller = CreateControllerWithoutUser();

		IActionResult result = await controller.CreateTelegramConnectLink();

		result.Should().BeOfType<UnauthorizedResult>();

		_telegramService.Verify(
			x => x.CreateLinkTokenForUserAsync(It.IsAny<int>()),
			Times.Never);
	}

	[Fact]
	public async Task CreateTelegramConnectLink_WhenServiceReturnsSuccess_ReturnsOk()
	{
		ProfileController controller = CreateController(userId: 42);
		DateTime expiresAtUtc = DateTime.UtcNow.AddMinutes(10);
		const string connectUrl = "https://t.me/test_bot?start=abc";

		_telegramService
			.Setup(x => x.CreateLinkTokenForUserAsync(42))
			.ReturnsAsync(TelegramLinkCreateResult.Success(connectUrl, expiresAtUtc));

		IActionResult result = await controller.CreateTelegramConnectLink();

		OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;

		ok.Value.Should().BeEquivalentTo(new
		{
			connectUrl,
			expiresAtUtc
		});

		_telegramService.Verify(
			x => x.CreateLinkTokenForUserAsync(42),
			Times.Once);
	}

	[Fact]
	public async Task CreateTelegramConnectLink_WhenServiceReturnsError_ReturnsBadRequest()
	{
		ProfileController controller = CreateController(userId: 42);

		_telegramService
			.Setup(x => x.CreateLinkTokenForUserAsync(42))
			.ReturnsAsync(TelegramLinkCreateResult.Fail("Telegram уже подключен"));

		IActionResult result = await controller.CreateTelegramConnectLink();

		BadRequestObjectResult badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;

		badRequest.Value.Should().BeEquivalentTo(new
		{
			message = "Telegram уже подключен"
		});

		_telegramService.Verify(
			x => x.CreateLinkTokenForUserAsync(42),
			Times.Once);
	}

	private ProfileController CreateController(int userId, string? role = null)
	{
		var claims = new List<Claim>
		{
			new(ClaimTypes.NameIdentifier, userId.ToString())
		};

		if (role is not null)
		{
			claims.Add(new Claim(ClaimTypes.Role, role));
		}

		var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
		var controller = new ProfileController(_profileService.Object, _telegramService.Object);

		controller.ControllerContext = new ControllerContext
		{
			HttpContext = new DefaultHttpContext
			{
				User = user
			}
		};

		return controller;
	}

	private ProfileController CreateControllerWithoutUser()
	{
		var controller = new ProfileController(_profileService.Object, _telegramService.Object);

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
