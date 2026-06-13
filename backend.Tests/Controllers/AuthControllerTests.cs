using System.Net;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;
using MyApp.Namespace;
using Org.BouncyCastle.Crypto.Engines;

namespace backend.Tests;

public class AuthControllerTests
{
	private readonly Mock<IAuthService> _authService = new(MockBehavior.Strict);
	private readonly Mock<IEmailSender> _emailSender = new(MockBehavior.Strict);
	[Fact]
	public async Task SingIn_WhenCredentialsInvalid_ReturnsUnauthorized()
	{
		AuthController controller = CreateController();
		var request = new LoginRequest("test@mail.com", "wrong-password");

		_authService
			.Setup(x => x.SignInAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(AuthResult.Fail("Invalid credentials"));

		IActionResult result = await controller.SignIn(request, CancellationToken.None);

		var unauthorized = result.Should()
			.BeOfType<UnauthorizedObjectResult>().Subject;
		unauthorized.Value.Should().BeEquivalentTo(new
		{
			message = "Invalid credentials"
		});

		_authService.Verify(
			x => x.SignInAsync(request, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}	
	[Fact]
	public async Task SingIn_WhenEmailIsNotConfirmed_ReturnsUnauthorized()
	{
		AuthController controller = CreateController();
		var request = new LoginRequest("test@mail.com", "123456");

		_authService
			.Setup(x => x.SignInAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(AuthResult.Fail("Подтвердите Email перед входом!"));

		IActionResult result = await controller.SignIn(request, CancellationToken.None);

		var unauthorized = result.Should()
			.BeOfType<UnauthorizedObjectResult>().Subject;
		unauthorized.Value.Should().BeEquivalentTo(new
		{
			message = "Подтвердите Email перед входом!"
		});

		_authService.Verify(
			x => x.SignInAsync(request, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}
	[Fact]
	public async Task SignIn_whenRequestIsValid_ReturnsOkAndAppendsCookie()
	{
		AuthController controller = CreateController();
		var request = new LoginRequest("test@mail.com",  "123456");
		UserDto user = CreateUserDto();
		DateTime expiresAtUtc = DateTime.UtcNow.AddHours(1);

		_authService
			.Setup(x => x.SignInAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(AuthResult.Success(user, "jwt-token", expiresAtUtc));

		IActionResult result = await controller.SignIn(request, CancellationToken.None);

		var ok = result.Should().BeOfType<OkObjectResult>().Subject;
		ok.Value.Should().BeEquivalentTo(new { user });

		controller.Response.Headers["Set-Cookie"].ToString()
			.Should().Contain("access_token=jwt-token");

		_authService.Verify(
			x => x.SignInAsync(request, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}
	[Fact]
	public async Task SignUp_WhenServiceRejectsEmptyFullName_ReturnsConflict()
	{
		AuthController controller = CreateController();

		var request = new CreateUserRequest(
			"",
			"test@mail.com",
			"123456",
			Role.Client,
			null,
			null
		);

		_authService
			.Setup(x => x.SignUpAsync(request, _emailSender.Object, It.IsAny<CancellationToken>()))
			.ReturnsAsync(SignUpResult.Fail("Full name is required"));

		IActionResult result = await controller.SignUp(request, CancellationToken.None, _emailSender.Object);

		var conflict = result.Should().BeOfType<ConflictObjectResult>().Subject;
		conflict.Value.Should().BeEquivalentTo(new
		{
			message = "Full name is required"
		});
	}
	[Fact]
	public async Task SignUp_WhenUserAlreadyExists_ReturnsConflict()
	{
		AuthController controller = CreateController();

		var request = new CreateUserRequest(
			"Test user",
			"test@mail.com",
			"123456",
			Role.Client,
			null,
			null
		);

		_authService
			.Setup(x => x.SignUpAsync(request, _emailSender.Object, It.IsAny<CancellationToken>()))
			.ReturnsAsync(SignUpResult.Fail("User already exists"));

		IActionResult result = await controller.SignUp(request, CancellationToken.None, _emailSender.Object);

		var conflict = result.Should().BeOfType<ConflictObjectResult>().Subject;
		conflict.Value.Should().BeEquivalentTo(new
		{
			message = "User already exists"
		});
	}
	[Fact]
	public async Task SignUp_WhenRequestIsValid_ReturnsOk()
	{
		AuthController controller = CreateController();
		var request = new CreateUserRequest(
			"Test user",
			"test@mail.com",
			"123456",
			Role.Client,
			null,
			null
		);

		UserDto user = CreateUserDto(1);

		_authService
			.Setup(x => x.SignUpAsync(request, _emailSender.Object, It.IsAny<CancellationToken>()))
			.ReturnsAsync(SignUpResult.Success());

		IActionResult result = await controller.SignUp(request, It.IsAny<CancellationToken>(), _emailSender.Object);

		var ok = result.Should().BeOfType<OkObjectResult>().Subject;
		ok.Value.Should().BeEquivalentTo(new
		{
			message = "Пользователь зарегистрирован. Код подтверждения отправлен на email."
		});

		_authService.Verify(x => x.SignUpAsync(
				request,
				_emailSender.Object,
				It.IsAny<CancellationToken>()),
			Times.Once);
	}
	[Fact]
	public async Task VerifyEmail_WhenVerificationFails_ReturnsBadRequest()
	{
		AuthController controller = CreateController();
		var request = new VerifyEmailRequest("test@mail.com", "000000");
		_authService
			.Setup(x => x.VerifyEmailAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(EmailVerifyResult.Fail("Неверный код"));

		IActionResult result = await controller.VerifyEmail(request, CancellationToken.None);

		var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
		badRequest.Value.Should().Be("Неверный код");
	}
	[Fact]
	public async Task VerifyEmail_WhenEmailIsAlreadyConfirmed_ReturnsOk()
	{
		AuthController controller = CreateController();
		var request = new VerifyEmailRequest("test@mail.com", "123456");
		User user = CreateUser(1);

		_authService
			.Setup(x => x.VerifyEmailAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(EmailVerifyResult.Fail("Email уже подтвержден"));

		IActionResult result = await controller.VerifyEmail(request, CancellationToken.None);

		var ok = result.Should().BeOfType<OkObjectResult>().Subject;

		ok.Value.Should().BeEquivalentTo(new
		{
			message = "Email уже подтвержден"
		});

		_authService.Verify(
			x => x.VerifyEmailAsync(request, It.IsAny<CancellationToken>()),
			Times.Once);
	}
	[Fact]
	public async Task VerifyEmail_WhenCodeExpires_ReturnsBadRequest()
	{
		AuthController controller = CreateController();
		var request = new VerifyEmailRequest("test@mail.com", "123456");
		_authService
			.Setup(x => x.VerifyEmailAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(EmailVerifyResult.Fail("Код истек"));

		IActionResult result = await controller.VerifyEmail(request, CancellationToken.None);

		var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
		badRequest.Value.Should().Be("Код истек");
	}
	[Fact]
	public async Task VerifyEmail_WhenToManyAttempts_ReturnsBadRequest()
	{
		AuthController controller = CreateController();
		var request = new VerifyEmailRequest("test@mail.com", "123456");
		_authService
			.Setup(x => x.VerifyEmailAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(EmailVerifyResult.Fail("Слишком много попыток.Запросите новый код"));

		IActionResult result = await controller.VerifyEmail(request, CancellationToken.None);

		var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
		badRequest.Value.Should().Be("Слишком много попыток.Запросите новый код");
	}
	[Fact]
	public async Task VerifyEmail_WhenRequestIsOk_ReturnsOk()
	{
		AuthController controller = CreateController("1");
		var request = new VerifyEmailRequest("test@mail.com", "123456");
		User user = CreateUser(1);
		_authService
			.Setup(x => x.VerifyEmailAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(EmailVerifyResult.Success(user));

		IActionResult result = await controller.VerifyEmail(request, CancellationToken.None);

		var ok = result.Should().BeOfType<OkObjectResult>().Subject;
		ok.Value.Should().BeEquivalentTo(new
		{
			message = "Email успешно подтвержден"
		});

		_authService.Verify(
			x => x.VerifyEmailAsync(request, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}
	[Fact]
	public async Task SignOut_WhenUserIdClaimIsNotInteger_ReturnsUnauthorized()
	{
		AuthController controller = CreateController("abc");

		IActionResult result = await controller.SignOut(CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_authService.Verify(
			x => x.SignOutAsnyc(It.IsAny<int>(), It.IsAny<CancellationToken>()),
			Times.Never
		);
	}
	[Fact]
	public async Task SignOut_WhenUserIsAuthenticated_ReturnsOk()
	{
		AuthController controller = CreateController("1");

		_authService
			.Setup(x => x.SignOutAsnyc(1, It.IsAny<CancellationToken>()))
			.Returns(Task.CompletedTask);

		IActionResult result = await controller.SignOut(CancellationToken.None);

		var ok = result.Should().BeOfType<OkObjectResult>().Subject;

		ok.Value.Should().BeEquivalentTo(new
		{
			message = "Signed out successfully."
		});

		_authService.Verify(
			x => x.SignOutAsnyc(1, It.IsAny<CancellationToken>()),
			Times.Once
		);

		string setCookieHeader =  controller.Response.Headers["Set-Cookie"]
			.ToString().ToLowerInvariant();

		setCookieHeader.Should().Contain("access_token=");
		setCookieHeader.Should().Contain("expires=", because: "удаление cookie делается через истёкшую cookie");
		setCookieHeader.Should().Contain("path=/");
		setCookieHeader.Should().Contain("httponly");
		setCookieHeader.Should().Contain("secure");
	    setCookieHeader.Should().Contain("samesite=lax");
	}
	[Fact]
	public async Task Me_WhenUserExists_ReturnsOk()
	{
		AuthController  controller = CreateController("1");
		UserDto user = CreateUserDto(1);

		_authService
			.Setup(x => x.Me(1, It.IsAny<CancellationToken>()))
			.ReturnsAsync(UserResult.Success(user));

		IActionResult result = await controller.Me(CancellationToken.None);

		var ok = result.Should().BeOfType<OkObjectResult>().Subject;
		ok.Value.Should().BeEquivalentTo(new {user});

		_authService.Verify(
			x => x.Me(1, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}
	[Fact]
	public async Task Me_WhenUserIdClaimsIsNotInteger_ReturnsUnauthorized()
	{
		AuthController controller = CreateController("abc");

		IActionResult result = await controller.Me(CancellationToken.None);

		result.Should().BeOfType<UnauthorizedResult>();

		_authService.Verify(
			x => x.Me(It.IsAny<int>(), It.IsAny<CancellationToken>()),
			Times.Never
		);
	}
	[Fact]
	public async Task Me_WhenUserNotFound_ReturnsUnauthorized()
	{
		AuthController controller = CreateController("2");

		_authService
			.Setup(x => x.Me(2, It.IsAny<CancellationToken>()))
			.ReturnsAsync(UserResult.Fail("User not found"));

		IActionResult result = await controller.Me(CancellationToken.None);

		var unauthorized = result.Should()
			.BeOfType<UnauthorizedObjectResult>()
			.Subject;

		unauthorized.Value.Should().BeEquivalentTo(new
		{
			message = "User not found"
		});

		_authService.Verify(
			x => x.Me(2, It.IsAny<CancellationToken>()),
			Times.Once);
	}
	[Fact]
	public async Task RecoveryPasswordRequest_WhenServiceHandlesEmptyEmail_ReturnsOk()
	{
		AuthController controller = CreateController();
		var request = new RecoveryPasswordRequest()
		{
			Email = ""
		};

		_authService
			.Setup(x => x.RequestPasswordResetAsync(request, _emailSender.Object, It.IsAny<CancellationToken>()))
			.ReturnsAsync(RequestPasswordResetResult.Success("Если пользователь существует, то код отправлен на почту"));

		IActionResult result = await controller.RecoveryPasswordRequest(request, _emailSender.Object, CancellationToken.None);
		var ok = result.Should().BeOfType<OkObjectResult>().Subject;
		ok.Value.Should().BeEquivalentTo(new
		{
			message = "Если пользователь существует, то код отправлен на почту" 
		});

		_authService.Verify(
			x => x.RequestPasswordResetAsync(request, _emailSender.Object, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}
	[Fact]
	public async Task RecoveryPasswordRequest_WhenServiceHandlesUnknownEmail_ReturnsOk()
	{
		AuthController controller = CreateController();
		var request = new RecoveryPasswordRequest()
		{
			Email = "test@test.com"
		};

		_authService
			.Setup(x => x.RequestPasswordResetAsync(request, _emailSender.Object, It.IsAny<CancellationToken>()))
			.ReturnsAsync(RequestPasswordResetResult.Success("Если пользователь существует, то код отправлен на почту"));

		IActionResult result = await controller.RecoveryPasswordRequest(request, _emailSender.Object, CancellationToken.None);

		var ok = result.Should().BeOfType<OkObjectResult>().Subject;
		ok.Value.Should().BeEquivalentTo(new
		{
			message = "Если пользователь существует, то код отправлен на почту" 
		});

		_authService.Verify(
			x => x.RequestPasswordResetAsync(request, _emailSender.Object, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}
	[Fact]
	public async Task RecoveryPasswordRequest_WhenRequestIsOk_ReturnsOk()
	{
		AuthController controller = CreateController("1");
		var request = new RecoveryPasswordRequest()
		{
			Email = "test@test.com"
		};

		_authService
			.Setup(x => x.RequestPasswordResetAsync(request, _emailSender.Object, It.IsAny<CancellationToken>()))
			.ReturnsAsync(RequestPasswordResetResult.Success("Если пользователь существует, то код отправлен на почту"));

		IActionResult result = await controller.RecoveryPasswordRequest(request, _emailSender.Object, CancellationToken.None);
		
		var ok = result.Should().BeOfType<OkObjectResult>().Subject;
		ok.Value.Should().BeEquivalentTo(new
		{
			message = "Если пользователь существует, то код отправлен на почту"
		});

		_authService.Verify(
			x => x.RequestPasswordResetAsync(request, _emailSender.Object, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}
	[Fact]
	public async Task RecoveryPasswordRequest_WhenServiceReturnsFailure_ReturnsInternalServerError()
	{
		AuthController controller = CreateController();
		var request = new RecoveryPasswordRequest()
		{
			Email = "test@test.com"
		};

		_authService
			.Setup(x => x.RequestPasswordResetAsync(request, _emailSender.Object, It.IsAny<CancellationToken>()))
			.ReturnsAsync(RequestPasswordResetResult.Fail("Ошибка при отправке письма"));

		IActionResult result = await controller.RecoveryPasswordRequest(request, _emailSender.Object, CancellationToken.None);

		ObjectResult objectResult = result.Should().BeOfType<ObjectResult>().Subject;
		objectResult.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
		objectResult.Value.Should().BeEquivalentTo(new
		{
			message = "Ошибка при отправке письма"
		});

		_authService.Verify(
			x => x.RequestPasswordResetAsync(request, _emailSender.Object, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}
	[Fact]
	public async Task ConfirmCodeRecoveryPassword_WhenEmailIsNullOrWhiteSpace_ReturnsBadRequest()
	{
		AuthController controller = CreateController("1");
		var request = new VerifyPasswordRequest()
		{
			Email = "",
			Code = "123456",
			NewPassword = "newpassword"
		};

		_authService
			.Setup(x => x.VerifyPasswordAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(VerifyPasswordResult.Fail("Введите Email"));

		IActionResult result = await controller.ConfirmCodeRecoveryPassword(request, CancellationToken.None);

		var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
		badRequest.Value.Should().BeEquivalentTo(new
		{
			message = "Введите Email"
		});
	}
	[Fact]
	public async Task ConfirmCodeRecoveryPassword_WhenCodeIsNullOrWhiteSpace_ReturnsBadRequest()
	{
		AuthController controller = CreateController("1");
		var request = new VerifyPasswordRequest()
		{
			Email = "test@test.com",
			Code = "",
			NewPassword = "newpassword"
		};

		_authService
			.Setup(x => x.VerifyPasswordAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(VerifyPasswordResult.Fail("Введите код восстановления"));

		IActionResult result = await controller.ConfirmCodeRecoveryPassword(request, CancellationToken.None);

		var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
		badRequest.Value.Should().BeEquivalentTo(new
		{
			message = "Введите код восстановления"
		});
	}
	[Fact]
	public async Task ConfirmCodeRecoveryPassword_WhenNewPasswordIsNullOrWhiteSpace_ReturnsBadRequest()
	{
		AuthController controller = CreateController("1");
		var request = new VerifyPasswordRequest()
		{
			Email = "test@test.com",
			Code = "123456",
			NewPassword = ""
		};

		_authService
			.Setup(x => x.VerifyPasswordAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(VerifyPasswordResult.Fail("Введите новый пароль"));

		IActionResult result = await controller.ConfirmCodeRecoveryPassword(request, CancellationToken.None);

		var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
		badRequest.Value.Should().BeEquivalentTo(new
		{
			message = "Введите новый пароль"
		});
	}
	[Fact]
	public async Task ConfirmCodeRecoveryPassword_WhenVerificationFails_ReturnsBadRequest()
	{
		AuthController controller = CreateController();
		var request = new VerifyPasswordRequest()
		{
			Email = "test@test.com",
			Code = "000000",
			NewPassword = "1234567"
		};
		_authService
			.Setup(x => x.VerifyPasswordAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(VerifyPasswordResult.Fail("Неверный код"));

		IActionResult result = await controller.ConfirmCodeRecoveryPassword(request, CancellationToken.None);

		var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
		badRequest.Value.Should().BeEquivalentTo(new
		{
			message = "Неверный код"
		});
	}
	[Fact]
	public async Task ConfirmCodeRecoveryPassword_WhenCodeExpires_ReturnsBadRequest()
	{
		AuthController controller = CreateController();
		var request = new VerifyPasswordRequest()
		{
			Email = "test@test.com",
			Code = "123456",
			NewPassword = "1234567"
		};
		_authService
			.Setup(x => x.VerifyPasswordAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(VerifyPasswordResult.Fail("Код истек"));

		IActionResult result = await controller.ConfirmCodeRecoveryPassword(request, CancellationToken.None);

		var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
		badRequest.Value.Should().BeEquivalentTo(new
		{
			message = "Код истек"
		});
	}
	[Fact]
	public async Task ConfirmCodeRecoveryPassword_WhenToManyAttempts_ReturnsBadRequest()
	{
		AuthController controller = CreateController();
		var request = new VerifyPasswordRequest()
		{
			Email = "test@test.com",
			Code = "123456",
			NewPassword = "1234567"
		};
		_authService
			.Setup(x => x.VerifyPasswordAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(VerifyPasswordResult.Fail("Слишком много попыток.Запросите новый код"));

		IActionResult result = await controller.ConfirmCodeRecoveryPassword(request, CancellationToken.None);

		var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
		badRequest.Value.Should().BeEquivalentTo(new
		{
			message = "Слишком много попыток.Запросите новый код"
		});
	}
	[Fact]
	public async Task ConfirmCodeRecoveryPassword_WhenRequestIsOk_ReturnsOk()
	{
		AuthController controller = CreateController("1");
		var request = new VerifyPasswordRequest()
		{
			Email = "test@test.com",
			Code = "123456",
			NewPassword = "1234567"
		};

		_authService
			.Setup(x => x.VerifyPasswordAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(VerifyPasswordResult.Success("Пароль успешно изменен"));

		IActionResult result = await controller.ConfirmCodeRecoveryPassword(request, CancellationToken.None);

		var ok = result.Should().BeOfType<OkObjectResult>().Subject;
		ok.Value.Should().BeEquivalentTo(new
		{
			message = "Пароль успешно изменен"
		});

		_authService.Verify(
			x => x.VerifyPasswordAsync(request, It.IsAny<CancellationToken>()),
			Times.Once
		);
	}
	private static UserDto CreateUserDto(int id = 1)
    {
        return new UserDto(
            id,
            "test@mail.com",
            "Test User",
            Role.Client,
            0,
            null,
            null,
            new List<string>(),
            null,
            null,
            null,
            DateTime.UtcNow,
            DateTime.UtcNow,
            false,
            false
        );
    }
	private static User CreateUser(int id = 1)
    {
        return new User
		{
           Id = id,
	       Email = "test@mail.com",
           FullName = "Test User",
		   PasswordHash = "test",
		   Salt = "test",
           Role = Role.Client,
           Rating = 0,
           Contacts = null,
           IsTelegramConnected = false,
           TelegramChatId = 5,
           TelegramUsername = "test",
           CompanyName = null,
           Skills = ["C#", "ASP.NET Core"],
           HourlyRate = 100m,
		   Currency = Currency.RUB,
		   CreatedAt = DateTime.UtcNow,
           LastSeenAt = DateTime.UtcNow,
           IsOnline = true,
           isEmailConfirmed = true
		};
    }

    private AuthController CreateController(string? userIdClaim = null)
    {
        ClaimsIdentity identity = string.IsNullOrWhiteSpace(userIdClaim)
            ? new ClaimsIdentity()
            : new ClaimsIdentity(
                new[] { new Claim(ClaimTypes.NameIdentifier, userIdClaim) },
                "TestAuth");

        var controller = new AuthController(CreateJwtOptions(), _authService.Object);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(identity)
            }
        };

        return controller;
    }
	private static IOptions<JwtOptions> CreateJwtOptions(
		string cookieName = "access_token",
		bool cookieSecure = true,
		string cookieSameSite = "Lax")
	{
		return Options.Create(new JwtOptions
		{
			Issuer = "test-issuer",
			Audience = "test-audience",
			Secret = "test-secret-key-with-enough-length",
			AccessTokenExpirationMinutes = 60,
			CookieName = cookieName,
			CookieSecure = cookieSecure,
			CookieSameSite = cookieSameSite
		});
	}
}
