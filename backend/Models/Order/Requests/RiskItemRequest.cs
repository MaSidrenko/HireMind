namespace backend;

public class RiskItemRequest
{
	public int Id { get; set; }
	public string Title { get; set; } = string.Empty;
	public RiskLevel Level { get; set; } = RiskLevel.medium;
	public string Impact { get; set; } = string.Empty;
	public string Action { get; set; } = string.Empty;
	public bool Resolved { get; set; } 
}
