using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Moq;

namespace backend.Tests;

public class ProfileControllerAuthorizationTests : IDisposable
{
	private readonly TestApplicationFactory _factory = new();

	[Fact]
	public async Task UpdateSkills_WhenUserIsNotAuthenticated_ReturnsUnauthorized()
	{
		HttpClient client = _factory.CreateClient();

		var request = new UpdateProfileSkillsRequest
		{
			Skills = ["C#", "ASP.NET Core"]
		};

		HttpResponseMessage response = await client.PatchAsJsonAsync(
			"/api/v1/profile/skills",
			request
		);
		
		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.ProfileServiceMock.Verify(
			x => x.UpdateSkillsAsync(
				It.IsAny<UpdateProfileSkillsRequest>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task UpdateSkills_whenUserIsAuthenticatedButHasNoRole_ReturnsForbidden()
	{
		HttpClient client = CreateAuthorizedClientWithoutRole();

		var request = new UpdateProfileSkillsRequest
		{
			Skills = ["C#", "ASP.NET Core"]
		};

		HttpResponseMessage response = await client.PatchAsJsonAsync(
			"/api/v1/profile/skills",
			request
		);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.ProfileServiceMock.Verify(
			x => x.UpdateSkillsAsync(
				It.IsAny<UpdateProfileSkillsRequest>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Theory]
	[MemberData(nameof(RolesExceptFreelancer))]
	public async Task UpdateSkills_WhenUserIsNotFreelancer_ReturnsForbidden(Role role)
	{
		HttpClient client = CreateAuhtorizedClient(role);

		var request = new UpdateProfileSkillsRequest
		{
			Skills = ["C#", "ASP.NET Core"]
		};

		HttpResponseMessage response = await client.PatchAsJsonAsync(
			"/api/v1/profile/skills",
			request
		);

		response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

		_factory.ProfileServiceMock.Verify(
			x => x.UpdateSkillsAsync(
				It.IsAny<UpdateProfileSkillsRequest>(),
				It.IsAny<int>(),
				It.IsAny<CancellationToken>()
			),
			Times.Never
		);
	}
	[Fact]
	public async Task UpdateSkills_WhenUserRileIsFreelancer_ReturnsOk()
	{
		const int userId = 42;

		HttpClient client = CreateAuhtorizedClient(Role.Freelancer, userId);

		var request = new UpdateProfileSkillsRequest
		{
			Skills = ["C#", "ASP.NET Core"]
		};

		User user = ProfileTestData.CreateFreelancerUser(userId);

		_factory.ProfileServiceMock
			.Setup(x => x.UpdateSkillsAsync(
				It.IsAny<UpdateProfileSkillsRequest>(),
				userId,
				It.IsAny<CancellationToken>())
			).ReturnsAsync(user);

			HttpResponseMessage response = await client.PatchAsJsonAsync(
				"/api/v1/profile/skills",
				request
			);

			response.StatusCode.Should().Be(HttpStatusCode.OK);

			_factory.ProfileServiceMock.Verify(
				x => x.UpdateSkillsAsync(
					It.IsAny<UpdateProfileSkillsRequest>(),
					userId,
					It.IsAny<CancellationToken>()),
				Times.Once);
	}

	private HttpClient CreateAuhtorizedClient(Role role, int userId = 42)
	{
		HttpClient client = CreateAuthorizedClientWithoutRole(userId);

		client.DefaultRequestHeaders.Add(
			TestAuthHandler.RoleHeader,
			role.ToString()
		);

		return client;
	}

	private HttpClient CreateAuthorizedClientWithoutRole(int userId = 42)
	{
		HttpClient client = _factory.CreateClient();

		client.DefaultRequestHeaders.Authorization = 
			new AuthenticationHeaderValue(TestAuthHandler.SchemeName);

		client.DefaultRequestHeaders.Add(
			TestAuthHandler.UserIdHeader,
			userId.ToString()
		);

		return client;
	}

	public static IEnumerable<object[]> RolesExceptFreelancer()
	{
		return Enum
			.GetValues<Role>()
			.Where(role => role != Role.Freelancer)
			.Select(role => new object[] { role });
	}

	public void Dispose()
	{
		_factory.Dispose();
	}
}
