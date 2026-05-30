namespace backend;

public class UserNotFoundException : AppException
{
	public int UserId { get; }

	public UserNotFoundException(int userId) : base($"Пользователь с ID {userId} не найден.", "user_not_found")
	{
		UserId = userId;
	}
	public UserNotFoundException(string message, string code) : base(message, code)
	{
	}
}
