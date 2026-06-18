namespace backend;

public class AdminUserDto
{
	public int Id { get; set; }
	public string FullName { get; set; } = string.Empty;
	public string Email { get; set; } = string.Empty;
	public string? PendingEmail { get; set; }
	public Role Role { get; set; }
	public double Rating { get; set; }
	public Contacts? Contacts { get; set; }
	public string? CompanyName { get; set; }
	public List<string> Skills { get; set; } = new();
	public decimal? HourlyRate { get; set; }
	public Currency? Currency { get; set; }
	public int? CompletedOrders { get; set; }
	public bool IsOnline { get; set; }
	public bool IsTelegramConnected { get; set; }
	public bool IsBanned { get; set; }
	public bool IsEmailConfirmed { get; set; }
}
