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

	public DbSet<Order> Orders => Set<Order>();
	public DbSet<Proposal> Proposals => Set<Proposal>();
	public DbSet<AiConversation> AiConversations => Set<AiConversation>();
	public DbSet<AiMessage> AiMessages => Set<AiMessage>();

	public DbSet<OrderBriefSections> OrderBriefSections => Set<OrderBriefSections>();
	public DbSet<ClarificationQuestion> ClarificationQuestions => Set<ClarificationQuestion>();
	public DbSet<ScopeItem> ScopeItems => Set<ScopeItem>();
	public DbSet<DoneCriterion> DoneCriteria => Set<DoneCriterion>();
	public DbSet<RiskItem> Risks => Set<RiskItem>();
	public DbSet<Contact> Contacts => Set<Contact>();
	public DbSet<TelegramLinkToken> TelegramLinkTokens => Set<TelegramLinkToken>();

	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		modelBuilder.Entity<User>()
			.OwnsOne(u => u.Contacts);

		modelBuilder.Entity<Order>()
			.HasOne(order => order.BriefSections)
			.WithOne(brief => brief.Order)
			.HasForeignKey<OrderBriefSections>(brief => brief.OrderId)
			.OnDelete(DeleteBehavior.Cascade);

		modelBuilder.Entity<Order>()
			.HasMany(order => order.ClarificationQuestions)
			.WithOne(question => question.Order)
			.HasForeignKey(question => question.OrderId)
			.OnDelete(DeleteBehavior.Cascade);

		modelBuilder.Entity<Order>()
			.HasMany(order => order.ScopeItems)
			.WithOne(scopeItem => scopeItem.Order)
			.HasForeignKey(scopeItem => scopeItem.OrderId)
			.OnDelete(DeleteBehavior.Cascade);

		modelBuilder.Entity<Order>()
			.HasMany(order => order.DoneCriteria)
			.WithOne(doneCriterion => doneCriterion.Order)
			.HasForeignKey(doneCriterion => doneCriterion.OrderId)
			.OnDelete(DeleteBehavior.Cascade);

		modelBuilder.Entity<Order>()
			.HasMany(order => order.Risks)
			.WithOne(risk => risk.Order)
			.HasForeignKey(risk => risk.OrderId)
			.OnDelete(DeleteBehavior.Cascade);

		modelBuilder.Entity<Order>()
			.HasMany(order => order.Proposals)
			.WithOne(proposal => proposal.Order)
			.HasForeignKey(proposal => proposal.OrderId)
			.OnDelete(DeleteBehavior.Cascade);

		modelBuilder.Entity<Order>()
			.HasMany(order => order.AiConversations)
			.WithOne(conversation => conversation.Order)
			.HasForeignKey(conversation => conversation.OrderId)
			.OnDelete(DeleteBehavior.Cascade);

		modelBuilder.Entity<AiConversation>()
			.HasOne(conversation => conversation.CreatedByUser)
			.WithMany()
			.HasForeignKey(conversation => conversation.CreatedByUserId)
			.OnDelete(DeleteBehavior.Restrict);

		modelBuilder.Entity<AiConversation>()
			.HasMany(conversation => conversation.Messages)
			.WithOne(message => message.Conversation)
			.HasForeignKey(message => message.ConversationId)
			.OnDelete(DeleteBehavior.Cascade);

		modelBuilder.Entity<AiMessage>()
			.HasOne(message => message.AuthorUser)
			.WithMany()
			.HasForeignKey(message => message.AuthorUserId)
			.OnDelete(DeleteBehavior.SetNull);

	}
}
