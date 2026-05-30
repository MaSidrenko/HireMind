namespace backend;

public class EmptyContactsException : AppException
{
	public EmptyContactsException() : base("Укажите один из вариантов контактов", "empty_contacts") {}
	public EmptyContactsException(string message, string code) : base(message, code)
	{ }
}
