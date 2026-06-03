namespace backend;

public class ContactRequestAlreadyExistsException : AppException
{
	public ContactRequestAlreadyExistsException()
		: base("Запрос на контакт уже отправлен.", "contact_request_already_exists") {}

	public ContactRequestAlreadyExistsException(string message, string code) : base(message, code)
	{
	}
}
