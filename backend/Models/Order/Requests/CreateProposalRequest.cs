namespace backend;

public class CreateProposalRequest
{
	public int OrderId { get; set; }
	public int Price { get; set; }
	public string Message { get; set; } = string.Empty;
	public int EstimatedDays { get; set; }
}
