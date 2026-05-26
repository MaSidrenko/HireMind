namespace backend;

public class Proposal
{
public int Id { get; set; }

	public int OrderId { get; set; }
	public Order Order { get; set; } = null!;

	public int FreelancerId { get; set; }
	public User Freelancer { get; set; } = null!;

	public decimal Price { get; set; }
	public Currency Currency { get; set; }

	public int EstimatedDays { get; set; }

	public ProposalStatus Status { get; set; } = ProposalStatus.pending;

	public string Message { get; set; } = string.Empty;

	public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
