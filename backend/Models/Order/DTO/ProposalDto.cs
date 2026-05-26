namespace backend;

public class ProposalDto
{
	public int Id { get; set; }
    public int ProjectId { get; set; }
    public int FreelancerId { get; set; }
    public string FreelancerName { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public Currency Currency { get; set; }
    public int EstimatedDays { get; set; }
    public ProposalStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}
