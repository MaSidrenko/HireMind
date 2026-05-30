namespace backend;

public interface IOrderService
{
	public Task<Order?> GetByIdAsync(int id, CancellationToken ct);
	public Task<List<OrderListItemDto>> GetListAsync(CancellationToken ct);
	public Task<List<OrderListItemDto>> GetAccteptedProjectListAsync(CancellationToken ct);
	public Task<Order> CreateOrderAsync(CreateOrderRequest request, int userID, CancellationToken ct);
	public Task<Order> UpdateOrderAsync(int orderId,int userId, UpdateOrderRequest request, CancellationToken ct);
	public Task<Order> RespondToOrderAsync(int proposalId, CreateProposalRequest request, CancellationToken ct);
	public Task<Order> AcceptProposalAsync(int proposalId, int userId, CancellationToken ct);
	public Task<Order> WithdrawProposalAsync(int proposalId,int userId, CancellationToken ct);
	Task<Order> UpdateClientApproval(int orderId, int userId, UpdateApprovalRequest request, CancellationToken ct);
	public Task<Order> UpdateFreelancerApprovalAsync(int orderId, int userId, UpdateApprovalRequest request, CancellationToken ct);
	public Task<Order?> LoadOrderGraphAsync(int orderId, CancellationToken ct, bool asNoTracking = false);
}
