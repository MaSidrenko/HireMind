namespace backend;

public class OrderUpdateRequest
{
	public string Title { get; set; } = string.Empty;
	public string RawDescription { get; set; } = string.Empty;
	public string TechnicalSpecification { get; set; } = string.Empty;
	public Category Category { get; set; }
	public decimal BudgetMin { get; set; }
	public decimal BudgetMax { get; set; }
	public Currency Currency { get; set; }
	public Payment BudgetType { get; set; }
	public OrderStatus Status { get; set; }
	public List<string> Skills { get; set; } = new();
	public string? CompanyName { get; set; }
}