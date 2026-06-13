using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using MyApp.Namespace;

namespace backend.Tests;

public class FreelancerControllerTests
{
	private readonly Mock<IFreelancerService> _freelancerServiceMock = new(MockBehavior.Strict);

	[Fact]
	public async Task GetAllFreelancers_WhenRequestIsValid_ReturnsOkWithFreelancerDtos()
	{
		FreelancerController controller = CreateController(1);
		User freelancer = ProfileTestData.CreateFreelancerUser(2);
		List<FreelancerDto> freelancers = [CreateFreelancerDto(freelancer)];

		_freelancerServiceMock
			.Setup(x => x.GetAllFreelancersAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(freelancers);

		IActionResult result = await controller.GetAllFreelancers(CancellationToken.None);

		OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;

		ok.Value.Should().BeEquivalentTo(freelancers);

		_freelancerServiceMock.Verify(
			x => x.GetAllFreelancersAsync(It.IsAny<CancellationToken>()),
			Times.Once
		);
	}

	[Fact]
	public async Task GetAllFreelancers_WhenServiceReturnsEmptyList_ReturnsOkWithEmptyList()
	{
		FreelancerController controller = CreateController(1);

		_freelancerServiceMock
			.Setup(x => x.GetAllFreelancersAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(new List<FreelancerDto>());

		IActionResult result = await controller.GetAllFreelancers(CancellationToken.None);

		OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;

		ok.Value.Should().BeEquivalentTo(new List<FreelancerDto>());

		_freelancerServiceMock.Verify(
			x => x.GetAllFreelancersAsync(It.IsAny<CancellationToken>()),
			Times.Once
		);
	}

	[Fact]
	public async Task GetAllContact_WhenUserIdClaimIsMissing_ReturnsUnauthorized()
	{
		FreelancerController controller = CreateControllerWithoutUser();

		IActionResult result = await controller.GetAllConact(CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_freelancerServiceMock.Verify(
			x => x.GetAllContactRequestsAsync(
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task GetAllContact_WhenRequestIsValid_ReturnsOkWithContactRequestDtos()
	{
		FreelancerController controller = CreateController(1);
		ContactRequestDto contact = ProfileTestData.CreateContactRequestDto(2);
		List<ContactRequestDto> listContact = [contact];

		_freelancerServiceMock
			.Setup(x => x.GetAllContactRequestsAsync(1, It.IsAny<CancellationToken>()))
			.ReturnsAsync(listContact);

		IActionResult result = await controller.GetAllConact(CancellationToken.None);

		OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;

		ok.Value.Should().BeEquivalentTo(listContact);

		_freelancerServiceMock.Verify(
			x => x.GetAllContactRequestsAsync(1, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}

	[Fact]
	public async Task CreateContactRequest_WhenUserIdClaimIsMissing_ReturnsUnauthorized()
	{
		FreelancerController controller = CreateControllerWithoutUser();

		IActionResult result = await controller.CreateContactRequest("Test message", 1, CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_freelancerServiceMock.Verify(
			x => x.CreateContactRequestAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<string>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task CreateContactRequest_WhenMessageIsNull_ReturnsBadRequest()
	{
		FreelancerController controller = CreateController(1);

		string? message = null;

		IActionResult result = await controller.CreateContactRequest(message!, 1, CancellationToken.None);

		BadRequestObjectResult badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;

		badRequest.Value.Should().BeEquivalentTo("Message cannot be empty");

		_freelancerServiceMock.Verify(
			x => x.CreateContactRequestAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<string>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task CreateContactRequest_WhenRequestIsValid_ReturnsOkWithContactRequestDto()
	{
		FreelancerController controller = CreateController(1);
		string message = "Message";

		ContactRequestDto contact = ProfileTestData.CreateContactRequestDto(2);
		
		_freelancerServiceMock
			.Setup(x => x.CreateContactRequestAsync(1, 1, message, It.IsAny<CancellationToken>()))
			.ReturnsAsync(contact);

		IActionResult result = await controller.CreateContactRequest(message, 1, CancellationToken.None);

		OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;

		ok.Value.Should().BeEquivalentTo(contact);

		_freelancerServiceMock.Verify(
			x => x.CreateContactRequestAsync(1, 1, message, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}

	[Fact]
	public async Task CreateContactRequest_WhenMessageIsWhitespace_ReturnsBadRequest()
	{
		FreelancerController controller = CreateController(1);

		string? message = " ";

		IActionResult result = await controller.CreateContactRequest(message, 1, CancellationToken.None);

		BadRequestObjectResult badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;

		badRequest.Value.Should().BeEquivalentTo("Message cannot be empty");

		_freelancerServiceMock.Verify(
			x => x.CreateContactRequestAsync(
				It.IsAny<int>(),
				It.IsAny<int>(),
				It.IsAny<string>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}

	[Fact]
	public async Task CreateContactRequest_WhenMessageHasSurroundingWhitespace_TrimBeforeCallingService()
	{
		FreelancerController controller = CreateController(1);
		const string message = "  Test message  ";
		const string trimmedMessage = "Test message";
		ContactRequestDto contact = ProfileTestData.CreateContactRequestDto(3);

		_freelancerServiceMock
			.Setup(x => x.CreateContactRequestAsync(1, 1, trimmedMessage, It.IsAny<CancellationToken>()))
			.ReturnsAsync(contact);

		IActionResult result = await controller.CreateContactRequest(message, 1, CancellationToken.None);

		OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;

		ok.Value.Should().BeEquivalentTo(contact);

		_freelancerServiceMock.Verify(
			x => x.CreateContactRequestAsync(1, 1, trimmedMessage, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}

	private FreelancerController CreateController(int userId, string? role = null)
	{
		var claims = new List<Claim>
		{
			new(ClaimTypes.NameIdentifier, userId.ToString())
		};

		if(role is not null)
			claims.Add(new Claim(ClaimTypes.Role, role));

		var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
		var controller = new FreelancerController(_freelancerServiceMock.Object);

		controller.ControllerContext = new ControllerContext
		{
			HttpContext = new DefaultHttpContext
			{
				User = user
			}
		};

		return controller;
	}

	private FreelancerController CreateControllerWithoutUser()
	{
		var controller = new FreelancerController(_freelancerServiceMock.Object);

		controller.ControllerContext = new ControllerContext
		{
			HttpContext = new DefaultHttpContext
			{
				User = new ClaimsPrincipal(new ClaimsIdentity())
			}
		};

		return controller;
	}

	private static FreelancerDto CreateFreelancerDto(User freelancer)
	{
		return new FreelancerDto(
			freelancer.Id,
			freelancer.FullName,
			freelancer.Email,
			freelancer.Rating,
			freelancer.IsOnline,
			freelancer.HourlyRate,
			freelancer.Currency,
			freelancer.Skills,
			freelancer.CompletedOrders,
			new FreelancerContactsDto(
				freelancer.Contacts?.Telegram ?? string.Empty,
				freelancer.Contacts?.Phone ?? string.Empty,
				freelancer.Email
			)
		);
	}
}
