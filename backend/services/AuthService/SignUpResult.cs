public sealed class SignUpResult
{
    public bool IsSuccess { get; }
    public string? ErrorMessage { get; }

    private SignUpResult(bool isSuccess, string? errorMessage)
    {
        IsSuccess = isSuccess;
        ErrorMessage = errorMessage;
    }

    public static SignUpResult Success()
    {
        return new SignUpResult(true, null);
    }

    public static SignUpResult Fail(string errorMessage)
    {
        return new SignUpResult(false, errorMessage);
    }
}