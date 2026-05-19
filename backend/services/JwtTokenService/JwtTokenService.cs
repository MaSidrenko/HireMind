using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace backend;

public class JwtTokenService : IJwtTokenService
{
	private readonly JwtOptions _jwtOptions;

	public JwtTokenService(IOptions<JwtOptions> jwtOptions)
	{
		_jwtOptions = jwtOptions.Value;
	}
	public string GenerateAccessToken(User user, DateTime expiresAtUts)
	{
		var claims = new List<Claim>
		{
			new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
			new(JwtRegisteredClaimNames.Email, user.Email),
			new(ClaimTypes.NameIdentifier, user.Id.ToString()),
			new(ClaimTypes.Email, user.Email),
			new(ClaimTypes.Role, user.Role.ToString()),
			new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
		};

		var key = new SymmetricSecurityKey(
			Encoding.UTF8.GetBytes(_jwtOptions.Secret)
		);

		var crentials = new SigningCredentials(
			key,
			SecurityAlgorithms.HmacSha256
		);

		var token = new JwtSecurityToken(
			issuer: _jwtOptions.Issuer,
			audience: _jwtOptions.Audience,
			claims: claims,
			expires: expiresAtUts,
			signingCredentials: crentials
		);

		return new JwtSecurityTokenHandler().WriteToken(token);
	}
}
