namespace backend;

public class RiskItem
{
	public int Id { get; set; }
	
	public int OrderId { get; set;}
	public Order Order { get; set; } = null!;

	public string Title { get; set; } = string.Empty;
	public RiskLevel Level { get; set; } = RiskLevel.medium;

	public string Impact { get; set; } = string.Empty;
	public string Action { get; set; } = string.Empty;

	public bool Resolved { get; set; } = false;
}
