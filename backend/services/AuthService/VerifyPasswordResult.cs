namespace backend;

public class VerifyPasswordResult
{
	public bool IsSuccess { get; }
	public string Message { get; }

	private VerifyPasswordResult(bool isSuccess, string message)
	{
		IsSuccess = isSuccess;
		Message = message;
	}

	public static VerifyPasswordResult Success(string message)
	{
		return new VerifyPasswordResult(true, message);
	}

	public static VerifyPasswordResult Fail(string message)
	{
		return new VerifyPasswordResult(false, message);
	}
}
