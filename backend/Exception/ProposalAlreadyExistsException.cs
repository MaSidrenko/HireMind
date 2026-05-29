namespace backend;

public class ProposalAlreadyExistsException : AppException
{
	public int OrderId { get; }
	public int FreelancerId { get; }

	public ProposalAlreadyExistsException(int orderId, int freelancerId) : base($"Вы({freelancerId}) уже отправляли предложение для этого заказа({orderId}).", "proposal_already_exists")
	{
		OrderId = orderId;
		FreelancerId = freelancerId;
	}
	public ProposalAlreadyExistsException(string message, string code) : base(message, code)
	{
	}
}
