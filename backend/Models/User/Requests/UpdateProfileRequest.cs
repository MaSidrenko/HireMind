namespace backend;

public class UpdateProfileRequest
{
	public string Email { get; set; } = string.Empty;
	public string FullName { get; set; } = string.Empty;
	// public Role Role { get; set; }
	public Contacts Contacts { get; set; } = new();
	public string? CompanyName { get; set; }
	public List<string>? Skills { get; set; }
	public decimal? HourlyRate { get; set; }
	public Currency? Currency { get; set; }
}
