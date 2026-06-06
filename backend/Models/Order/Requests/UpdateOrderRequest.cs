namespace backend;

public class UpdateOrderRequest
{
	public string? Title {get;set;}
	public string? RawDescription {get;set;}
	public string? TechnicalSpecification { get; set; }

	public Category Category {get;set;}

	public decimal BudgetMin {get;set;}
	public decimal BudgetMax {get;set;}

	public Currency Currency {get;set;}
	public Payment BudgetType {get;set;}

	public List<string> Skills {get;set;} = new();
	
	public OrderStatus Status {get;set;}
	public WorkflowStage WorkflowStage { get; set; }

	public bool AiGenerated { get; set; }
	public int ReadinessScore { get; set; }

	public BriefSectionsRequest BriefSections { get; set; } = new();

	public List<ClarificationQuestionRequest> ClarificationQuestions { get; set; } = new();
	public List<ScopeItemRequest> ScopeItems { get; set; } = new();
	public List<DoneCriterionRequest> DoneCriteria { get; set; } = new();
	public List<RiskItemRequest> Risks { get; set; } = new();

	// public ApprovalsRequest Approvals { get; set; } = new();
	
	public string? CompanyName {get;set;}
}
