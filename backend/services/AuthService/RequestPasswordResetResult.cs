namespace backend;

public class RequestPasswordResetResult
{
	public bool IsSuccess { get; init; }
	public string? Message { get; init; }

	public static RequestPasswordResetResult Success(string message)
	{
		return new RequestPasswordResetResult
		{
			IsSuccess = true,
			Message = message
		};
	}

	public static RequestPasswordResetResult Fail(string message)
	{
		return new RequestPasswordResetResult
		{
			IsSuccess = false,
			Message = message
		};
	}
}
