using System.Security.Claims;
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
	public async Task<AuthResult> SignUpAsync(CreateUserRequest request, CancellationToken ct = default)
	{
		if(string.IsNullOrWhiteSpace(request.FullName))
			return AuthResult.Fail("Full name is required");

		string email = request.Email.Trim().ToLowerInvariant();

		bool emailAlreadyExists = await _userService.CheckExistsUserByEmailAsync(email, ct);

		if(emailAlreadyExists)
		{
			return AuthResult.Fail("Email already exists");
		}

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
		};

		await _userService.CreateUserAsnyc(newUser, ct);
		await _userService.SaveChangesAsync(ct);


		var expiresAtUtc = DateTime.UtcNow.AddMinutes(
			_jwtOptions.AccessTokenExpirationMinutes
		);

		var accessToken = _jwtTokenService.GenerateAccessToken(
			newUser,
			expiresAtUtc
		);

		UserDto userDto = new(
			newUser.Id,
			newUser.Email,
			newUser.FullName,
			newUser.Role,
			newUser.Contacts,
			newUser.CompanyName,
			newUser.CreatedAt,
			newUser.LastSeenAt,
			newUser.IsOnline
		);

		return AuthResult.Success(
			userDto,
			accessToken,
			expiresAtUtc
		);
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
}