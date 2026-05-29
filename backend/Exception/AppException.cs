namespace backend;

public class AppException : Exception
{
	public string Code { get; }
	protected AppException(string message, string code): base(message)
	{
		Code = code;
	}

	protected AppException(string message, string code, Exception innerException)
		:base(message, innerException)
	{
		Code = code;
	}
}
