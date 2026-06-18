using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Moq;

namespace backend.Tests;

public class FreelancerControllerAuthorizationTest : IDisposable
{
	private readonly TestApplicationFactory _factory = new();

	[Fact]
	public async Task GetAllFreelancers_WhenUserIsNotAuthenticated_ReturnsUnauthorized()
	{
		HttpClient client = _factory.CreateClient();

		HttpResponseMessage response = await client.GetAsync("/api/v1/freelancer/freelancers");

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.FreelancerServiceMock.Verify(
			x => x.GetAllFreelancersAsync(It.IsAny<CancellationToken>()),
			Times.Never
		);
	}

	[Fact]
	public async Task GetAllFreelancers_WhenUserIsAuthenticatedButHasNoRole_ReturnsForbidden()
	{
		HttpClient client = CreateAuthorizedClientWithoutRole();

		HttpResponseMessage response = await client.GetAsync("/api/v1/freelancer/freelancers");

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.FreelancerServiceMock.Verify(
			x => x.GetAllFreelancersAsync(It.IsAny<CancellationToken>()),
			Times.Never
		);
	}

	[Theory]
	[MemberData(nameof(RolesExceptClientOrAdmin))]
	public async Task GetAllFreelancers_WhenUserIsNotAllowed_ReturnsForbidden(Role role)
	{
		HttpClient client = CreateAuthorizedClient(role);

		HttpResponseMessage response = await client.GetAsync("/api/v1/freelancer/freelancers");

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.FreelancerServiceMock.Verify(
			x => x.GetAllFreelancersAsync(It.IsAny<CancellationToken>()),
			Times.Never
		);
	}

	[Theory]
	[MemberData(nameof(AllowedRoles))]
	public async Task GetAllFreelancers_WhenUserRoleIsAllowed_ReturnsOk(Role role)
	{
		const int userId = 1;
		HttpClient client = CreateAuthorizedClient(role, userId);
		User freelancer = ProfileTestData.CreateFreelancerUser(2);

		_factory.FreelancerServiceMock
			.Setup(x => x.GetAllFreelancersAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync([CreateFreelancerDto(freelancer)]);

		HttpResponseMessage response = await client.GetAsync("/api/v1/freelancer/freelancers");

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.FreelancerServiceMock.Verify(
			x => x.GetAllFreelancersAsync(It.IsAny<CancellationToken>()),
			Times.Once
		);
	}

	[Fact]
	public async Task GetAllContact_WhenUserIsNotAuthenticated_ReturnsUnauthorized()
	{
		HttpClient client = _factory.CreateClient();

		HttpResponseMessage response = await client.GetAsync("/api/v1/freelancer/contact-requests");

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.FreelancerServiceMock.Verify(
			x => x.GetAllContactRequestsAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()),
			Times.Never
		);
	}

	[Fact]
	public async Task GetAllContact_WhenUserIsAuthenticatedButHasNoRole_ReturnsForbidden()
	{
		HttpClient client = CreateAuthorizedClientWithoutRole();

		HttpResponseMessage response = await client.GetAsync("/api/v1/freelancer/contact-requests");

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.FreelancerServiceMock.Verify(
			x => x.GetAllContactRequestsAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()),
			Times.Never
		);
	}

	[Theory]
	[MemberData(nameof(RolesExceptClientOrAdmin))]
	public async Task GetAllContact_WhenUserIsNotAllowed_ReturnsForbidden(Role role)
	{
		HttpClient client = CreateAuthorizedClient(role);

		HttpResponseMessage response = await client.GetAsync("/api/v1/freelancer/contact-requests");

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.FreelancerServiceMock.Verify(
			x => x.GetAllContactRequestsAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()),
			Times.Never
		);
	}

	[Theory]
	[MemberData(nameof(AllowedRoles))]
	public async Task GetAllContact_WhenUserRoleIsAllowed_ReturnsOk(Role role)
	{
		const int userId = 1;
		HttpClient client = CreateAuthorizedClient(role, userId);
		ContactRequestDto contact = ProfileTestData.CreateContactRequestDto(2);
		List<ContactRequestDto> contacts = [contact];

		_factory.FreelancerServiceMock
			.Setup(x => x.GetAllContactRequestsAsync(userId, It.IsAny<CancellationToken>()))
			.ReturnsAsync(contacts);

		HttpResponseMessage response = await client.GetAsync("/api/v1/freelancer/contact-requests");

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.FreelancerServiceMock.Verify(
			x => x.GetAllContactRequestsAsync(userId, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}

	[Fact]
	public async Task CreateContactRequest_WhenUserIsNotAuthenticated_ReturnsUnauthorized()
	{
		HttpClient client = _factory.CreateClient();

		HttpResponseMessage response = await client.PostAsJsonAsync(
			"/api/v1/freelancer/1/contact-requests",
			"Test message"
		);

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.FreelancerServiceMock.Verify(
			x => x.CreateContactRequestAsync(
				It.IsAny<int>(),
				1,
				"Test message",
				It.IsAny<CancellationToken>()),
			Times.Never
		);
	}

	[Fact]
	public async Task CreateContactRequest_WhenUserIsAuthenticatedButHasNoRole_ReturnsForbidden()
	{
		HttpClient client = CreateAuthorizedClientWithoutRole();

		HttpResponseMessage response = await client.PostAsJsonAsync(
			"/api/v1/freelancer/1/contact-requests",
			"Test message"
		);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.FreelancerServiceMock.Verify(
			x => x.CreateContactRequestAsync(
				It.IsAny<int>(),
				1,
				"Test message",
				It.IsAny<CancellationToken>()),
			Times.Never
		);
	}

	[Theory]
	[MemberData(nameof(RolesExceptClientOrAdmin))]
	public async Task CreateContactRequest_WhenUserIsNotAllowed_ReturnsForbidden(Role role)
	{
		HttpClient client = CreateAuthorizedClient(role);

		HttpResponseMessage response = await client.PostAsJsonAsync(
			"/api/v1/freelancer/1/contact-requests",
			"Test message"
		);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.FreelancerServiceMock.Verify(
			x => x.CreateContactRequestAsync(
				It.IsAny<int>(),
				1,
				"Test message",
				It.IsAny<CancellationToken>()),
			Times.Never
		);
	}

	[Theory]
	[MemberData(nameof(AllowedRoles))]
	public async Task CreateContactRequest_WhenUserRoleIsAllowed_ReturnsOk(Role role)
	{
		const int userId = 1;
		HttpClient client = CreateAuthorizedClient(role, userId);

		_factory.FreelancerServiceMock
			.Setup(x => x.CreateContactRequestAsync(
				userId,
				2,
				"Test Message",
				It.IsAny<CancellationToken>()))
			.ReturnsAsync(new ContactRequestDto
			{
				Id = 3,
				FreelancerId = 2,
				Message = "Test Message",
				Status = ContactStatus.sent,
				CreatedAt = DateTime.UtcNow.AddHours(-5)
			});

		HttpResponseMessage response = await client.PostAsJsonAsync(
			"/api/v1/freelancer/2/contact-requests",
			"Test Message"
		);

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.FreelancerServiceMock.Verify(
			x => x.CreateContactRequestAsync(
				userId,
				2,
				"Test Message",
				It.IsAny<CancellationToken>()),
			Times.Once
		);
	}

	public static IEnumerable<object[]> AllowedRoles()
	{
		return [new object[] { Role.Client }, new object[] { Role.Admin }];
	}

	public static IEnumerable<object[]> RolesExceptClientOrAdmin()
	{
		return Enum
			.GetValues<Role>()
			.Where(role => role != Role.Client && role != Role.Admin)
			.Select(role => new object[] { role });
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

	public void Dispose()
	{
		_factory.Dispose();
	}
}
