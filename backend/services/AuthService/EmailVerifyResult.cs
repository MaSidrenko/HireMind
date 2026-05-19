namespace backend;

public sealed record  EmailVerifyResult
{
	public bool IsSuccess {get; init; }
	public string ErrorMessage { get; init;}
	public User? User {get; init;}

	public static EmailVerifyResult Fail(string message)
	{
		return new EmailVerifyResult
		{
			IsSuccess = false,
			ErrorMessage = message
		};
	}

	public static EmailVerifyResult Success(User user)
	{
		return new EmailVerifyResult
		{
			IsSuccess = true, 
			User = user
		};
	}
}
