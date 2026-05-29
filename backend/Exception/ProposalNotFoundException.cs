namespace backend;

public class ProposalNotFoundException : AppException
{
	public int ProposalId { get; }

	public ProposalNotFoundException(int proposalId) : base($"Предложение с ID {proposalId} не найдено.", "proposal_not_found")
	{
		ProposalId = proposalId;
	}
	public ProposalNotFoundException(string message, string code) : base(message, code)
	{
	}
}
