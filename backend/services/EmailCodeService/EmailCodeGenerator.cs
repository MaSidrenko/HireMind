using System.Security.Cryptography;

namespace backend;

public static class EmailCodeGenerator
{
	public static string GenerateCode()
	{
		return RandomNumberGenerator.GetInt32(0, 1000000).ToString("D6");
	}
}
