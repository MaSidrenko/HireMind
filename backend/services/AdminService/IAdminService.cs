using MyApp.Namespace;

namespace backend;

public interface IAdminService
{
	public Task<List<User>> GetUserAsync(CancellationToken ct);
	public Task<List<Order>> GetOrdersAsync(CancellationToken ct);
	public Task<User> ChangeUserDataAsync(int userId, AdminUpdateRequest request, CancellationToken ct);
	public Task<User> EmailChangeAsync(int userId, AdminEmailChangeRequest request, IEmailSender emailSender, CancellationToken ct);
	public Task<User> PromoteToAdminAsync(int userId, CancellationToken ct);
	public Task<User> BanUserAsync(int userId,AdminBanUserRequest request, CancellationToken ct);
	public Task<User> DeleteUserAsync(int userId, CancellationToken ct);
	public Task<Order> UpdateOrderAsync(int orderId, OrderUpdateRequest request, CancellationToken ct);
	public Task<Order> DeleteOrderAsync(int orderId, CancellationToken ct);
}
