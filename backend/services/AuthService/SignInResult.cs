namespace backend;

public sealed record AuthResult
{
	public bool IsSuccess { get; init; }
	public string? ErrorMessage { get; init; }
	public UserDto? User {get; init; }
	public string? AccessToken { get; init; }
	public DateTime ExpiresAtUtc { get; init; }

	public static AuthResult Fail(string message)
	{
		return new AuthResult
		{
			IsSuccess = false,
			ErrorMessage = message	
		};
	}

	public static AuthResult Success(UserDto user, string accessToken, DateTime expiresAtUtc)
	{
		return new AuthResult
		{
			IsSuccess = true,
			User = user,
			AccessToken = accessToken,
			ExpiresAtUtc = expiresAtUtc
		};
	}
}
