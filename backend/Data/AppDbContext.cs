using Microsoft.EntityFrameworkCore;

namespace backend;
/// <summary>
/// DbContext for main BD
/// </summary>
public class AppDbContext : DbContext
{
	/// <summary>
	/// Constructor for DbContext. Needed for connection to DB
	/// </summary>
	/// <param name="options">DbContextOptions connect to db</param>
	public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
	{ }
	/// <summary>
	/// User table in BD
	/// </summary>
	public DbSet<User> Users => Set<User>();

	protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<User>()
        .OwnsOne(u => u.Contacts);
}
}
