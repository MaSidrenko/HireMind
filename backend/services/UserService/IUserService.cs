using Microsoft.AspNetCore.Mvc;

namespace backend;

public interface IUserService
{
	Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);
	Task<User?> GetByIdAsync(int id, CancellationToken ct = default);
	Task<bool> CheckExistsUserByEmailAsync(string email, CancellationToken ct = default);
	Task SaveChangesAsync(CancellationToken ct = default);
	Task CreateUserAsnyc(User user, CancellationToken ct = default);

}
