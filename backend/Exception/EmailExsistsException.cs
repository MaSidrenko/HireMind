namespace backend;

public class EmailExsistsException : AppException
{
	public EmailExsistsException() : base("Этот email уже используется", "email_exsists") {}
	public EmailExsistsException(string message, string code) : base(message, code)
	{
	}
}
