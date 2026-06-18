using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend;

public class UserService : IUserService
{
	private readonly AppDbContext _db;

	public UserService(AppDbContext db)
	{
		_db = db;
	}

	public async Task<bool> CheckExistsUserByEmailAsync(string email, CancellationToken ct = default)
		=> await _db.Users.AnyAsync(u => u.Email == email);

	public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
	=> await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

	public async Task<User?> GetByPendingEmailAsync(string email, CancellationToken ct = default)
	=> await _db.Users.FirstOrDefaultAsync(u => u.PendingEmail == email, ct);

	public async Task<User?> GetByIdAsync(int id, CancellationToken ct = default)
	=> await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);

	public async Task SaveChangesAsync(CancellationToken ct = default)
	=> await _db.SaveChangesAsync(ct);
	public async Task CreateUserAsnyc(User user, CancellationToken ct = default)
		=> await _db.Users.AddAsync(user, ct);
}
