namespace backend;
/// <summary>
/// Interface for password hashing service
/// </summary>
public interface IPasswordHashSerivce
{
	PasswordHashResult HashPassword(string password);
	bool VerifyPassword(string password, string storedHash, string storedSalt);

}
