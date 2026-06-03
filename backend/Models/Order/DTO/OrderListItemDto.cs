namespace backend;

public class OrderListItemDto
{
	public int Id { get; set; }

	public int HirerId { get; set; }
	public string HirerName { get; set; } = string.Empty;
	public string CompanyName { get; set; } = string.Empty;
	public double HirerRating { get; set; }

	public int? SelectedFreelancerId { get; set; }
	public string? SelectedFreelancerName { get; set; }
	public double? SelectedFreelancerRating { get; set; }

	public string Title { get; set; } = string.Empty;
	public string ShortDescription { get; set; } = string.Empty;
	public string RawDescription { get; set; } = string.Empty;
	public string TechnicalSpecification { get; set; } = string.Empty;

	public Category Category { get; set; }

	public decimal BudgetMin { get; set; }
	public decimal BudgetMax { get; set; }

	public Currency Currency { get; set; }
	public Payment BudgetType { get; set; }

	public List<string> Skills { get; set; } = new();

	public OrderStatus Status { get; set; }
	public WorkflowStage WorkflowStage { get; set; }

	public int ProposalsCount { get; set; }
	public List<ProjectProposalDto> Proposals { get; set; } = new();

	public DateTime? PublishedAt { get; set; }
	public DateTime? CompletedAt { get; set; }
	public DateTime UpdatedAt { get; set; }

	public bool AiGenerated { get; set; }
	public int ReadinessScore { get; set; }

	public BriefSectionsDto BriefSections { get; set; } = new();

	public List<ClarificationQuestionDto> ClarificationQuestions { get; set; } = new();
	public List<ScopeItemDto> ScopeItems { get; set; } = new();
	public List<DoneCriterionDto> DoneCriteria { get; set; } = new();
	public List<RiskItemDto> Risks { get; set; } = new();

	public ApprovalsDto Approvals { get; set; } = new();
	public int? ClientRatingByFreelancer { get; set; }
	public int? FreelancerRatingByClient { get; set; }
}
