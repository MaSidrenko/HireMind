namespace backend;
/// <summary>
/// User model for db
/// </summary>
public sealed class User
{
	/// <summary>
	/// User id
	/// </summary>
	public int Id { get; set; }
	/// <summary>
	/// Email user. Used for user login. Must be unique
	/// </summary>
	public string Email { get; set; } = string.Empty;
	public string FullName { get; set; } = string.Empty;
	/// <summary>
	/// Password Hash
	/// </summary>
	public string? PasswordHash { get; set; } = string.Empty;
	/// <summary>
	/// Salt for hash password
	/// </summary>
	public string? Salt { get; set; }
	 /// <summary>
    /// User role in the system.
    /// </summary>
	public Role Role { get; set; }
	/// <summary>
	/// Contacts User. Minimum required fields: telegram or phone. 
	/// </summary>
	public Contacts? Contacts { get; set; }
	/// <summary>
	/// Company Name for heir's
	/// </summary>
	public string? CompanyName { get; set; }
	public List<string> Skills { get; set; } = new();
	/// <summary>
	/// When user sing in to us
	/// </summary>
	public DateTime CreatedAt { get; set; }
	/// <summary>
	/// When user last seen on our system
	/// </summary>
	public DateTime LastSeenAt { get; set; }
	/// <summary>
	/// Is user online or not. True if yes, false otherwise. 
	/// </summary>
	public bool IsOnline { get; set; } = false;
	
	public bool isEmailConfirmed { get; set; } = false;
	public string? EmailVerificationCodeHash { get; set; }
	public DateTime? EmailVerificationCodeExpiresAtUtc { get; set; }
	public int EmailVerificationAttempts { get; set; } = 0;
}
