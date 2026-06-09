namespace backend;

public class VerifyPasswordResult
{
	  public bool IsSuccess { get; }
    public string? ErrorMessage { get; }

    private VerifyPasswordResult(bool isSuccess, string? errorMessage)
    {
        IsSuccess = isSuccess;
        ErrorMessage = errorMessage;
    }

    public static VerifyPasswordResult Success()
    {
        return new VerifyPasswordResult(true, null);
    }

    public static VerifyPasswordResult Fail(string errorMessage)
    {
        return new VerifyPasswordResult(false, errorMessage);
    }
}
