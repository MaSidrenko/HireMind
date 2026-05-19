namespace backend;

public sealed class JwtOptions
{
	public string Issuer { get; init; } = string.Empty;
	public string Audience { get; init; } = string.Empty;
	public string Secret { get; init; } = string.Empty;
	
	public int AccessTokenExpirationMinutes { get; init; } = 60;

	public string CookieName { get; init; } = "access_token";
	public bool CookieSecure { get; init; } = true;
	public string CookieSameSite { get; init; } = "Lax";
}
