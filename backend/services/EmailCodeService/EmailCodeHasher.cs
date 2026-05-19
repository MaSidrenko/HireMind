using System.Security.Cryptography;
using System.Text;

namespace backend;

public static class EmailCodeHasher
{
	public static string Hash(string code)
	{
		byte[] bytes = SHA256.HashData(Encoding.UTF8.GetBytes(code));
		return Convert.ToHexString(bytes);
	}

	public static bool Verify(string code, string hash)
	{
		return Hash(code) == hash;
	}
}
