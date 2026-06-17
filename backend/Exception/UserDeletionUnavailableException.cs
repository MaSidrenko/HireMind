namespace backend;

public class UserDeletionUnavailableException : AppException
{
	public UserDeletionUnavailableException()
		: base("Hard delete доступен только для пустых пользователей.", "user_deletion_unavailable")
	{
	}

	public UserDeletionUnavailableException(string message, string code = "user_deletion_unavailable")
		: base(message, code)
	{
	}
}
