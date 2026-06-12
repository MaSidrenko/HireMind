using System.Security.Claims;
using System.Text.Encodings.Web;
// using Castle.Core.Logging;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace backend.Tests;

public sealed class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
	public const string SchemeName = "Test";
	public const string UserIdHeader = "X-Test-UserId";
	public const string RoleHeader = "X-Test-Role";

	public TestAuthHandler(
		IOptionsMonitor<AuthenticationSchemeOptions> options,
		ILoggerFactory logger,
		UrlEncoder encoder
	) : base(options, logger, encoder)
	{ }

	protected override Task<AuthenticateResult> HandleAuthenticateAsync()
	{
		string authorization = Request.Headers.Authorization.ToString();

		if(!string.Equals(authorization, SchemeName, StringComparison.OrdinalIgnoreCase))
			return Task.FromResult(AuthenticateResult.NoResult());

		string userId = Request.Headers[UserIdHeader].ToString();

		if(string.IsNullOrWhiteSpace(userId))
			return Task.FromResult(AuthenticateResult.Fail("Missing test user id."));

		string role = Request.Headers[RoleHeader].ToString();

		var claims = new List<Claim>
		{
			new(ClaimTypes.NameIdentifier, userId),
			new(ClaimTypes.Name, "Test User")
		};

		if(!string.IsNullOrWhiteSpace(role))
			claims.Add(new Claim(ClaimTypes.Role, role));

		var identity = new ClaimsIdentity(claims, SchemeName);
		var principal = new ClaimsPrincipal(identity);
		var ticket = new AuthenticationTicket(principal, SchemeName);

		return Task.FromResult(AuthenticateResult.Success(ticket));
	}
}
