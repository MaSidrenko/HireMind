namespace backend;

public class EmptyFullNameException : AppException
{
	public EmptyFullNameException() : base("Укажите имя пользователя", "empty_full_name")
	{}
	public EmptyFullNameException(string message, string code) : base(message, code)
	{
	}
}
