namespace backend;

public class ForbiddenProposalOperationException : AppException
{
	public ForbiddenProposalOperationException() : base("У вас нет прав для выполнения операции с этим предложением.", "forbidden_proposal_operation") {}
	public ForbiddenProposalOperationException(string message, string code) : base(message, code)
	{
		
	}
}
