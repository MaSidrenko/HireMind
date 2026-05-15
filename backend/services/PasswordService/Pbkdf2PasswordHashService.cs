using System.Security.Cryptography;

namespace backend;
/// <summary>
/// Service for hashing algorithm using PBKDF2 algorithm
/// </summary>
public class Pbkdf2PasswordHashService : IPasswordHashSerivce
{
	private const int SaltSize = 16;
	private const int HashSize = 32;
	private const int Iterations = 600_000;
	public PasswordHashResult HashPassword(string password)
	{
		byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);

		byte[] hash = Rfc2898DeriveBytes.Pbkdf2(
			password: password,
			salt: salt,
			iterations: Iterations,
			hashAlgorithm: HashAlgorithmName.SHA256,
			outputLength: HashSize
		);

		return new PasswordHashResult(
			Hash: Convert.ToBase64String(hash),
			Salt: Convert.ToBase64String(salt)
		);
	}

	public bool VerifyPassword(string password, string storedHash, string storedSalt)
	{
		byte[] salt;
		byte[] expectedHash;

		try
		{
			salt = Convert.FromBase64String(storedSalt);
			expectedHash = Convert.FromBase64String(storedHash);
		}catch (FormatException)
		{
			return false;
		}

		byte[] actualHash = Rfc2898DeriveBytes.Pbkdf2(
			password: password,
			salt: salt,
			iterations: Iterations,
			hashAlgorithm: HashAlgorithmName.SHA256,
			outputLength: expectedHash.Length
		);

		return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
	}
}
