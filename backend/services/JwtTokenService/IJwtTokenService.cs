namespace backend;

public interface IJwtTokenService	
{
	string GenerateAccessToken(User user, DateTime expiresAtUts);
}
