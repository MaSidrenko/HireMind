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
	public double Rating { get; set; } = 0;
	/// <summary>
	/// Contacts User. Minimum required fields: telegram or phone. 
	/// </summary>
	public Contacts? Contacts { get; set; }
	/// <summary>
	/// Shows whether the user has linked Telegram notifications to the account.
	/// </summary>
	public bool IsTelegramConnected { get; set; } = false;
	/// <summary>
	/// Telegram chat id used by the bot to send direct notifications.
	/// </summary>
	public long? TelegramChatId { get; set; }
	/// <summary>
	/// Telegram username captured at the moment of successful linking.
	/// </summary>
	public string? TelegramUsername { get; set; }
	/// <summary>
	/// Company Name for heir's
	/// </summary>
	public string? CompanyName { get; set; }
	public List<string> Skills { get; set; } = new();
	public decimal HourlyRate { get; set; }
	public Currency Currency { get; set; }
	public int CompletedOrders { get; set; } = 0;
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

	public string?  PasswordResetCodeHash { get; set; }
	public DateTime? PasswordResetCodeExpiresAtUtc { get; set; }
	public int PasswordResetAttempts { get; set; } = 0;
}
