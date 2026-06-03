namespace backend;

public class ProposalWithdrawalUnavailableException : AppException
{
	public ProposalWithdrawalUnavailableException()
		: base("Нельзя отозвать уже принятый отклик.", "proposal_withdrawal_unavailable") {}

	public ProposalWithdrawalUnavailableException(string message, string code)
		: base(message, code) {}
}
