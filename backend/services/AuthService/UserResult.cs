namespace backend;

public sealed record UserResult
{
		public bool IsSuccess { get; init; }
	public string? ErrorMessage { get; init; }
	public UserDto? User {get; init; }

	public static UserResult Fail(string message)
	{
		return new UserResult
		{
			IsSuccess = false,
			ErrorMessage = message	
		};
	}
	public static UserResult Success(UserDto userDto)
	{
		return new UserResult
		{
			IsSuccess = true,
			User = userDto
		};
	}
}
