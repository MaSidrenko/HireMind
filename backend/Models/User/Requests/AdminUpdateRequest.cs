namespace backend;

public class AdminUpdateRequest
{
	public string FullName { get; set; } = string.Empty;
	public string Email { get; set; } = string.Empty;
	public Role Role { get; set; }
	public AdminContactsUpdateRequest? Contacts { get; set; }
	public string? CompanyName { get; set; }
	public List<string> Skills { get; set; } = new();
	public decimal HourlyRate { get; set; }
	public Currency Currency { get; set; }
}

public class AdminContactsUpdateRequest
{
	public string? Telegram { get; set; }
	public string? Phone { get; set; }
}
