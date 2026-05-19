using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace backend;

public class AuthService : IAuthService
{
	private readonly IUserService _userService;
	private readonly IPasswordHashSerivce _passwordHashService;
	private readonly IJwtTokenService _jwtTokenService;
	private readonly JwtOptions _jwtOptions;

	public AuthService(
		IUserService userSerivce, 
		IPasswordHashSerivce passwordHashService, 
		IJwtTokenService jwtTokenService, 
		IOptions<JwtOptions> jwtOptions)
	{
		_userService = userSerivce;
		_passwordHashService = passwordHashService;
		_jwtTokenService = jwtTokenService;
		_jwtOptions = jwtOptions.Value;
	}

	public async Task<AuthResult> SignInAsync(LoginRequest request, CancellationToken ct = default)
	{
		string email = request.Email.Trim().ToLowerInvariant();

		User? user = await _userService.GetByEmailAsync(email, ct);

		const string invalidCredentialsMessage = "Invalid email or password. Please Try again";

		if(user is null)
		{
			return AuthResult.Fail(invalidCredentialsMessage);
		}

		if(string.IsNullOrWhiteSpace(user.PasswordHash) || string.IsNullOrWhiteSpace(user.Salt))
		{
			return AuthResult.Fail(invalidCredentialsMessage);
		}

		if(!user.isEmailConfirmed)
		{
			return AuthResult.Fail("Подтвердите email перед входом!");
		}

		bool isValidPassword = _passwordHashService.VerifyPassword(
			request.Password, user.PasswordHash, user.Salt
		);

		if(!isValidPassword)
		{
			return AuthResult.Fail(invalidCredentialsMessage);
		}

		DateTime nowUtc = DateTime.UtcNow;

		user.LastSeenAt = nowUtc;
		user.IsOnline = true;

		await _userService.SaveChangesAsync(ct);

		DateTime expiresAtUtc = nowUtc.AddMinutes(
			_jwtOptions.AccessTokenExpirationMinutes
		);

		string accessToken = _jwtTokenService.GenerateAccessToken(
			user,
			expiresAtUtc
		);

		UserDto userDto = new (
			user.Id,
			user.Email,
			user.FullName,
			user.Role,
			user.Contacts,
			user.CompanyName,
			user.CreatedAt,	
			user.LastSeenAt,
			user.IsOnline
		);

		return AuthResult.Success(
			userDto,
			accessToken,
			expiresAtUtc
		);
	}
	public async Task<SignUpResult> SignUpAsync(
    CreateUserRequest request,
    IEmailSender emailSender,
    CancellationToken ct = default)
{
    if (string.IsNullOrWhiteSpace(request.FullName))
        return SignUpResult.Fail("Full name is required");

    string email = request.Email.Trim().ToLowerInvariant();

    bool emailAlreadyExists =
        await _userService.CheckExistsUserByEmailAsync(email, ct);

    if (emailAlreadyExists)
        return SignUpResult.Fail("Email already exists");

    var code = EmailCodeGenerator.GenerateCode();
    var passwordHashResult = _passwordHashService.HashPassword(request.Password);

    User newUser = new()
    {
        Email = email,
        FullName = request.FullName,
        Role = request.Role,
        Contacts = request.Contacts,
        CompanyName = request.CompanyName,
        PasswordHash = passwordHashResult.Hash,
        Salt = passwordHashResult.Salt,
        CreatedAt = DateTime.UtcNow,
        LastSeenAt = DateTime.UtcNow,

        IsOnline = false,
        isEmailConfirmed = false,
        EmailVerificationCodeHash = EmailCodeHasher.Hash(code),
        EmailVerificationCodeExpiresAtUtc = DateTime.UtcNow.AddMinutes(15),
        EmailVerificationAttempts = 0
    };

    await _userService.CreateUserAsnyc(newUser, ct);
    await _userService.SaveChangesAsync(ct);

    await emailSender.SendEmailAsync(
        newUser.Email,
        "Код подтверждения",
        $"Ваш код подтверждения: {code}"
    );

    return SignUpResult.Success();
}
	public async Task SignOutAsnyc(int userId, CancellationToken ct)
	{
		User? user = await _userService.GetByIdAsync(userId, ct);

		if(user is null)
		{
			return;
		}

		user.IsOnline = false;
		user.LastSeenAt = DateTime.UtcNow;

		await _userService.SaveChangesAsync(ct);
	}
	public async Task<UserResult> Me(int userId, CancellationToken ct)
	{
		User? user = await _userService.GetByIdAsync(userId, ct);

		if(user is null)
		{
			return UserResult.Fail("User not found");
		}


		UserDto userDto = new(
			user.Id,
			user.Email,
			user.FullName,
			user.Role,
			user.Contacts,
			user.CompanyName,
			user.CreatedAt,
			user.LastSeenAt,
			user.IsOnline
		);

		return UserResult.Success(userDto);
	}

	public async Task<EmailVerifyResult> VerifyEmailAsync(VerifyEmailRequest request, CancellationToken ct = default)
	{
		User? user = await _userService.GetByEmailAsync(request.Email, ct);

		if(user is null)
		{
			return EmailVerifyResult.Fail("Неверный код подтверждения");
		}

		if(user.isEmailConfirmed)
		{
			return EmailVerifyResult.Fail("Email уже подтвержден");
		}

		if(user.EmailVerificationCodeExpiresAtUtc is null || user.EmailVerificationCodeExpiresAtUtc < DateTime.UtcNow)
		{
			return EmailVerifyResult.Fail("Код истек");
		}

		if(user.EmailVerificationAttempts > 5)
		{
			return EmailVerifyResult.Fail("Слишком много попыток.Запросите новый код");
		}

		bool isCodeValid = EmailCodeHasher.Verify(request.Code, user.EmailVerificationCodeHash!);

		if(!isCodeValid)
		{
			user.EmailVerificationAttempts++;
			await _userService.SaveChangesAsync();

			return EmailVerifyResult.Fail("Неверный код");
		}

		user.isEmailConfirmed = true;
		user.EmailVerificationCodeHash = null;
		user.EmailVerificationCodeExpiresAtUtc = null;
		user.EmailVerificationAttempts = 0;

		await _userService.SaveChangesAsync();
		
		return EmailVerifyResult.Success(user);
	}
}