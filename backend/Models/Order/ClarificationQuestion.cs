namespace backend;

public class ClarificationQuestion
{
	public int Id { get; set; }
	public int OrderId { get; set; }
	public Order Order { get; set; } = null!;

	public string Question { get; set; } = string.Empty;
	public RiskLevel Importance { get; set; } = RiskLevel.medium;
	public string Answer { get; set; } = string.Empty;

	public List<string> Options { get; set; } = new();
}
