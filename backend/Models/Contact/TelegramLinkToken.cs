namespace backend;

public class TelegramLinkToken
{
	public int Id { get; set; }
	public int UserId { get; set; }
	public string TokenHash { get; set; } = string.Empty;
	public DateTime CreatedAt { get; set; }
	public DateTime ExpiresAt { get; set; }
	public DateTime? UsedAt { get; set; }
	public bool IsUsed { get; set; }
}
