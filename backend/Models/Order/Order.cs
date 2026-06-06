namespace backend;



public class Order
{
	public int Id { get; set; }

	public int CustomerId { get; set; }
	public User Customer { get; set; } = null!;

	public int? FreelancerId { get; set; }
	public User? Freelancer { get; set; }

	public string Title { get; set; } = string.Empty;
	public string Description { get; set; } = string.Empty;
	public string TechnicalSpecification { get; set; } = string.Empty;

	public decimal MinPrice { get; set; }
	public decimal MaxPrice { get; set; }

	public Currency Currency { get; set; }
	public Payment Payment { get; set; }

	public List<string> Skills { get; set; } = new();
	public Category Category { get; set; }

	public OrderStatus Status { get; set; } = OrderStatus.Draft;
	public WorkflowStage WorkflowStage { get; set; } = WorkflowStage.raw;

	public bool AiGenerated { get; set; } = false;
	public int ReadinessScore { get; set; } = 0;

	public bool ClientApproved { get; set; } = false;
	public bool FreelancerApproved { get; set; } = false;
	public bool ClientDoneApproved { get; set; } = false;
	public bool FreelancerDoneApproved { get; set;} = false;

	public int? ClientRatingByFreelancer { get; set; }
	public int? FreelancerRatingByClient { get; set; }

	public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
	public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
	public DateTime? PublishedAt { get; set; }
	public DateTime? CompletedAt { get; set; }
	public DateTime? DeadLineAt { get; set; }

	public OrderBriefSections? BriefSections { get; set; }

	public List<ClarificationQuestion> ClarificationQuestions { get; set; } = new();
	public List<ScopeItem> ScopeItems { get; set; } = new();
	public List<DoneCriterion> DoneCriteria { get; set; } = new();
	public List<RiskItem> Risks { get; set; } = new();
	public List<AiConversation> AiConversations { get; set; } = new();

	public List<Proposal> Proposals { get; set; } = new();
}
