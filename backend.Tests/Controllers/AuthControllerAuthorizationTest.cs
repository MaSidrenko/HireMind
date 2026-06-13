using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Moq;

namespace backend.Tests;

public class AuthControllerAuthorizationTest : IDisposable
{
	private readonly TestApplicationFactory _factory = new();

	[Fact]
	public async Task SignOut_WhenUserIsNotAuthenticated_ReturnsUnauthorized()
	{
		HttpClient client = _factory.CreateClient();

		HttpResponseMessage response = await client.PostAsync("/api/v1/auth/logout", null);

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.AuthServiceMock.Verify(
			x => x.SignOutAsnyc(It.IsAny<int>(), It.IsAny<CancellationToken>()),
			Times.Never
		);
	}
	[Fact]
	public async Task SignOut_WhenUserIsAuthenticated_ReturnsOk()
	{
		const int userId = 1;

		HttpClient client = CreateAuthorizedClient(userId);

		_factory.AuthServiceMock
			.Setup(x => x.SignOutAsnyc(
				userId,
				It.IsAny<CancellationToken>())
			).Returns(Task.CompletedTask);

		HttpResponseMessage response = await client.PostAsync("/api/v1/auth/logout", 
				null);

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.AuthServiceMock.Verify(
			x => x.SignOutAsnyc(
				userId,
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}
	[Fact]
	public async Task Me_WhenUserIsNotAuthenticated_ReturnsUnauthorized()
	{
		HttpClient client = _factory.CreateClient();

		HttpResponseMessage response = await client.GetAsync("/api/v1/auth/me");

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.AuthServiceMock.Verify(
			x => x.Me(It.IsAny<int>(), It.IsAny<CancellationToken>()),
			Times.Never
		);
	}
	[Fact]
	public async Task Me_WhenUserIsAuthenticated_RetrunsOk()
	{
		HttpClient client = CreateAuthorizedClient(1);
		UserDto userDto = CreateUserDto(1);

		_factory.AuthServiceMock
			.Setup(x => x.Me(
				1,
				It.IsAny<CancellationToken>()
			)).ReturnsAsync(UserResult.Success(userDto));

		HttpResponseMessage response = await client.GetAsync(
			"/api/v1/auth/me"
		);

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.AuthServiceMock.Verify(
			x => x.Me(
				1,
				It.IsAny<CancellationToken>()
			),
			Times.Once
		);
	}

	[Fact]
	public async Task SignIn_WhenRequestIsAnonymous_ReachesActionWithoutAuthorizeMiddleware()
	{
		HttpClient client = _factory.CreateClient();
		var request = new LoginRequest("test@mail.com", "wrong-password");

		_factory.AuthServiceMock
			.Setup(x => x.SignInAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(AuthResult.Fail("Invalid credentials"));

		HttpResponseMessage response = await client.PostAsJsonAsync(
			"/api/v1/auth/sign-in",
			request
		);

		response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

		_factory.AuthServiceMock.Verify(
			x => x.SignInAsync(request, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}

	[Fact]
	public async Task SignUp_WhenRequestIsAnonymous_ReachesActionWithoutAuthorizeMiddleware()
	{
		HttpClient client = _factory.CreateClient();
		var request = new CreateUserRequest(
			"Test User",
			"test@mail.com",
			"123456",
			Role.Client,
			null,
			null
		);

		_factory.AuthServiceMock
			.Setup(x => x.SignUpAsync(
				It.Is<CreateUserRequest>(r => r == request),
				_factory.EmailSenderMock.Object,
				It.IsAny<CancellationToken>()))
			.ReturnsAsync(SignUpResult.Success());

		HttpResponseMessage response = await client.PostAsJsonAsync(
			"/api/v1/auth/sign-up",
			request,
			CreateJsonSerializerOptions()
		);

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.AuthServiceMock.Verify(
			x => x.SignUpAsync(
				It.Is<CreateUserRequest>(r => r == request),
				_factory.EmailSenderMock.Object,
				It.IsAny<CancellationToken>()),
			Times.Once
		);
	}

	[Fact]
	public async Task VerifyEmail_WhenRequestIsAnonymous_ReachesActionWithoutAuthorizeMiddleware()
	{
		HttpClient client = _factory.CreateClient();
		var request = new VerifyEmailRequest("test@mail.com", "123456");

		_factory.AuthServiceMock
			.Setup(x => x.VerifyEmailAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(EmailVerifyResult.Success(CreateUser(1)));

		HttpResponseMessage response = await client.PostAsJsonAsync(
			"/api/v1/auth/email-verify",
			request
		);

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.AuthServiceMock.Verify(
			x => x.VerifyEmailAsync(request, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}

	[Fact]
	public async Task RecoveryPassword_WhenRequestIsAnonymous_ReachesActionWithoutAuthorizeMiddleware()
	{
		HttpClient client = _factory.CreateClient();
		var request = new RecoveryPasswordRequest
		{
			Email = "test@mail.com"
		};

		_factory.AuthServiceMock
			.Setup(x => x.RequestPasswordResetAsync(
				It.Is<RecoveryPasswordRequest>(r => r.Email == request.Email),
				_factory.EmailSenderMock.Object,
				It.IsAny<CancellationToken>()))
			.ReturnsAsync(RequestPasswordResetResult.Success(
				"Если пользователь существует, то код отправлен на почту"));

		HttpResponseMessage response = await client.PostAsJsonAsync(
			"/api/v1/auth/recovery-password",
			request
		);

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.AuthServiceMock.Verify(
			x => x.RequestPasswordResetAsync(
				It.Is<RecoveryPasswordRequest>(r => r.Email == request.Email),
				_factory.EmailSenderMock.Object,
				It.IsAny<CancellationToken>()),
			Times.Once
		);
	}

	[Fact]
	public async Task ConfirmRecoveryPassword_WhenRequestIsAnonymous_ReachesActionWithoutAuthorizeMiddleware()
	{
		HttpClient client = _factory.CreateClient();
		var request = new VerifyPasswordRequest
		{
			Email = "test@mail.com",
			Code = "123456",
			NewPassword = "newpassword"
		};

		_factory.AuthServiceMock
			.Setup(x => x.VerifyPasswordAsync(
				It.Is<VerifyPasswordRequest>(r =>
					r.Email == request.Email &&
					r.Code == request.Code &&
					r.NewPassword == request.NewPassword),
				It.IsAny<CancellationToken>()))
			.ReturnsAsync(VerifyPasswordResult.Success("Пароль успешно изменен"));

		HttpResponseMessage response = await client.PostAsJsonAsync(
			"/api/v1/auth/recovery-password/confirm",
			request
		);

		response.StatusCode.Should().Be(HttpStatusCode.OK);

		_factory.AuthServiceMock.Verify(
			x => x.VerifyPasswordAsync(
				It.Is<VerifyPasswordRequest>(r =>
					r.Email == request.Email &&
					r.Code == request.Code &&
					r.NewPassword == request.NewPassword),
				It.IsAny<CancellationToken>()),
			Times.Once
		);
	}

	[Fact]
	public async Task SignIn_WhenCookieContainsValidJwt_AllowsFollowUpMeRequest()
	{
		const int userId = 7;
		JwtOptions configuredJwtOptions = CreateJwtOptions();
		using TestApplicationFactory jwtFactory = CreateJwtFactory(configuredJwtOptions);
		HttpClient client = jwtFactory.CreateClient(new WebApplicationFactoryClientOptions
		{
			BaseAddress = new Uri("https://localhost")
		});
		using IServiceScope scope = jwtFactory.Services.CreateScope();
		JwtOptions jwtOptions = scope.ServiceProvider
			.GetRequiredService<IOptions<JwtOptions>>()
			.Value;
		JwtBearerOptions bearerOptions = scope.ServiceProvider
			.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>()
			.Get(JwtBearerDefaults.AuthenticationScheme);
		LoginRequest request = new("test@mail.com", "123456");
		UserDto userDto = CreateUserDto(userId);
		string accessToken = CreateAccessToken(CreateUser(userId), bearerOptions);
		DateTime expiresAtUtc = DateTime.UtcNow.AddHours(1);

		jwtFactory.AuthServiceMock
			.Setup(x => x.SignInAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(AuthResult.Success(userDto, accessToken, expiresAtUtc));

		jwtFactory.AuthServiceMock
			.Setup(x => x.Me(userId, It.IsAny<CancellationToken>()))
			.ReturnsAsync(UserResult.Success(userDto));

		HttpResponseMessage signInResponse = await client.PostAsJsonAsync(
			"/api/v1/auth/sign-in",
			request
		);

		signInResponse.StatusCode.Should().Be(HttpStatusCode.OK);
		signInResponse.Headers.TryGetValues("Set-Cookie", out IEnumerable<string>? setCookieHeaders)
			.Should().BeTrue();
		setCookieHeaders.Should().NotBeNull();
		string authCookie = setCookieHeaders!.Single();
		authCookie.Should().Contain($"{jwtOptions.CookieName}=");

		var meRequest = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/me");
		meRequest.Headers.Add("Cookie", authCookie.Split(';')[0]);

		HttpResponseMessage meResponse = await client.SendAsync(meRequest);

		meResponse.StatusCode.Should().Be(HttpStatusCode.OK);

		jwtFactory.AuthServiceMock.Verify(
			x => x.SignInAsync(request, It.IsAny<CancellationToken>()),
			Times.Once
		);
		jwtFactory.AuthServiceMock.Verify(
			x => x.Me(userId, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}

	private HttpClient CreateAuthorizedClient(int userId = 42)
	{
		HttpClient client = _factory.CreateClient();
		client.DefaultRequestHeaders.Authorization =
			new AuthenticationHeaderValue(TestAuthHandler.SchemeName);
		client.DefaultRequestHeaders.Add(TestAuthHandler.UserIdHeader, userId.ToString());
		return client;
	}

	private static TestApplicationFactory CreateJwtFactory(JwtOptions jwtOptions)
	{
		return new TestApplicationFactory(
			useTestAuthentication: false,
			configurationOverrides: CreateJwtConfiguration(jwtOptions));
	}

	private static IReadOnlyDictionary<string, string?> CreateJwtConfiguration(JwtOptions jwtOptions)
	{
		return new Dictionary<string, string?>
		{
			["Jwt:Issuer"] = jwtOptions.Issuer,
			["Jwt:Audience"] = jwtOptions.Audience,
			["Jwt:Secret"] = jwtOptions.Secret,
			["Jwt:AccessTokenExpirationMinutes"] =
				jwtOptions.AccessTokenExpirationMinutes.ToString(),
			["Jwt:CookieName"] = jwtOptions.CookieName,
			["Jwt:CookieSecure"] = jwtOptions.CookieSecure.ToString(),
			["Jwt:CookieSameSite"] = jwtOptions.CookieSameSite
		};
	}

	private static JwtOptions CreateJwtOptions()
	{
		return new JwtOptions
		{
			Issuer = "test-issuer",
			Audience = "test-audience",
			Secret = "test-secret-key-with-enough-length",
			AccessTokenExpirationMinutes = 60,
			CookieName = "access_token",
			CookieSecure = true,
			CookieSameSite = "Lax"
		};
	}

	private static string CreateAccessToken(User user, JwtBearerOptions bearerOptions)
	{
		SecurityKey signingKey = bearerOptions.TokenValidationParameters.IssuerSigningKey
			?? throw new InvalidOperationException("JWT signing key is missing.");
		SigningCredentials signingCredentials = new(
			signingKey,
			SecurityAlgorithms.HmacSha256
		);
		var token = new JwtSecurityToken(
			issuer: bearerOptions.TokenValidationParameters.ValidIssuer,
			audience: bearerOptions.TokenValidationParameters.ValidAudience,
			expires: DateTime.UtcNow.AddHours(1),
			signingCredentials: signingCredentials
		);

		token.Payload[ClaimTypes.NameIdentifier] = user.Id.ToString();
		token.Payload[ClaimTypes.Email] = user.Email;
		token.Payload[ClaimTypes.Role] = user.Role.ToString();
		token.Payload[JwtRegisteredClaimNames.Sub] = user.Id.ToString();
		token.Payload[JwtRegisteredClaimNames.Jti] = Guid.NewGuid().ToString();

		return new JwtSecurityTokenHandler().WriteToken(token);
	}

	private static JsonSerializerOptions CreateJsonSerializerOptions()
	{
		JsonSerializerOptions options = new();
		options.Converters.Add(new JsonStringEnumConverter());

		return options;
	}

	private static UserDto CreateUserDto(int id)
	{
		return new UserDto(
			id,
			"test@mail.com",
			"Test User",
			Role.Client,
			0,
			null,
			null,
			[],
			null,
			null,
			0,
			DateTime.UtcNow,
			DateTime.UtcNow,
			true,
			false
		);
	}

	private static User CreateUser(int id)
	{
		return new User
		{
			Id = id,
			Email = "test@mail.com",
			FullName = "Test User",
			PasswordHash = "hash",
			Salt = "salt",
			Role = Role.Client,
			CreatedAt = DateTime.UtcNow,
			LastSeenAt = DateTime.UtcNow,
			IsOnline = true,
			isEmailConfirmed = true
		};
	}

	public void Dispose() => _factory.Dispose();
}
