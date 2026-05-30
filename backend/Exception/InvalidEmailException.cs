namespace backend;

public class InvalidEmailException : AppException
{
	public InvalidEmailException() : base("Введите корректный email", "invalid_email")
	{ }
	public InvalidEmailException(string message, string code) : base(message, code)
	{
	}
}
