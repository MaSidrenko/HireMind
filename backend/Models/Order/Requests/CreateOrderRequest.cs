namespace backend;

public class CreateOrderRequest
{
	public string Title { get; set; } = string.Empty;
	public string RawDescription { get; set; } = string.Empty;
	public Category Category { get; set; }
	public decimal BudgetMin { get; set; }
	public decimal BudgetMax { get; set; }
	public Currency Currency { get; set; }
	public Payment BudgetType { get; set; }
	public List<string> Skills { get; set; } = new();
	public string? CompanyName { get; set; }
}
