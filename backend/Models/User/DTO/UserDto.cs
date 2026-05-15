namespace backend;

/// <summary>
/// Record for user. Dto for frontend 
/// Id - user id,
/// Email - email of user,
/// Role - role user: freelancer | client | admin
/// Contacts - optional contacts of user. Telegram or phone required 
/// CompanyName - company name if user is client
/// </summary>
public sealed record UserDto (
	int Id,
	string Email,
	string FullName,
	Role Role,
	Contacts? Contacts,
	string? CompanyName,
	DateTime CreatedAt,
	DateTime LastSeenAt,
	bool IsOnline
);
