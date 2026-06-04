namespace backend;

public class CreateOrderRequest
{
	public string Title { get; set; } = string.Empty;
	public string RawDescription { get; set; } = string.Empty;
	public string? TechnicalSpecification { get; set; }
	public Category Category { get; set; }
	public decimal BudgetMin { get; set; }
	public decimal BudgetMax { get; set; }
	public Currency Currency { get; set; }
	public Payment BudgetType { get; set; }
	public List<string> Skills { get; set; } = new();
	public bool AiGenerated { get; set; }
	public int ReadinessScore { get; set; }
	public BriefSectionsRequest BriefSections { get; set; } = new();
	public List<ClarificationQuestionRequest> ClarificationQuestions { get; set; } = new();
	public List<ScopeItemRequest> ScopeItems { get; set; } = new();
	public List<DoneCriterionRequest> DoneCriteria { get; set; } = new();
	public List<RiskItemRequest> Risks { get; set; } = new();
	public string? CompanyName { get; set; }
}
