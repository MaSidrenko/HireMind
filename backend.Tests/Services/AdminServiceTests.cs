using backend;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using MyApp.Namespace;

namespace backend.Tests.Services;

public class AdminServiceTests
{
	[Fact]
	public async Task ChangeUserDataAsync_WhenEmailDiffers_ThrowsEmailChangeWorkflowRequiredException()
	{
		using AppDbContext db = CreateDbContext();

		User user = CreateUser(1, Role.Client, "client@example.com");
		db.Users.Add(user);
		await db.SaveChangesAsync();

		AdminService service = CreateAdminService(db);
		AdminUpdateRequest request = new()
		{
			FullName = "Updated Name",
			Email = "new@example.com",
			Role = Role.Client,
			Skills = []
		};

		Func<Task> act = async () => await service.ChangeUserDataAsync(user.Id, request, CancellationToken.None);

		await act.Should().ThrowAsync<EmailChangeWorkflowRequiredException>();
	}

	[Fact]
	public async Task EmailChangeAsync_WhenEmailMatchesCurrent_ThrowsEmailMatchesCurrentException()
	{
		using AppDbContext db = CreateDbContext();

		User user = CreateUser(1, Role.Client, "client@example.com");
		db.Users.Add(user);
		await db.SaveChangesAsync();

		AdminService service = CreateAdminService(db);

		Func<Task> act = async () => await service.EmailChangeAsync(
			user.Id,
			new AdminEmailChangeRequest { NewEmail = user.Email },
			Mock.Of<IEmailSender>(),
			CancellationToken.None);

		await act.Should().ThrowAsync<EmailMatchesCurrentException>();
	}

	[Fact]
	public async Task EmailChangeAsync_WhenEmailSenderFails_RollsBackPendingEmailAndThrowsEmailChangeDeliveryFailedException()
	{
		using AppDbContext db = CreateDbContext();

		User user = CreateUser(1, Role.Client, "client@example.com");
		db.Users.Add(user);
		await db.SaveChangesAsync();

		Mock<IEmailSender> emailSender = new();
		emailSender
			.Setup(sender => sender.SendEmailAsync("new@example.com", It.IsAny<string>(), It.IsAny<string>()))
			.ThrowsAsync(new InvalidOperationException("smtp down"));

		AdminService service = CreateAdminService(db);

		Func<Task> act = async () => await service.EmailChangeAsync(
			user.Id,
			new AdminEmailChangeRequest { NewEmail = "new@example.com" },
			emailSender.Object,
			CancellationToken.None);

		await act.Should().ThrowAsync<EmailChangeDeliveryFailedException>();

		User persistedUser = await db.Users.SingleAsync(item => item.Id == user.Id);
		persistedUser.PendingEmail.Should().BeNull();
		persistedUser.EmailVerificationCodeHash.Should().BeNull();
		persistedUser.EmailVerificationCodeExpiresAtUtc.Should().BeNull();
		persistedUser.EmailVerificationAttempts.Should().Be(0);
	}

	[Fact]
	public async Task DeleteUserAsync_WhenUserHasActiveOrders_ThrowsUserDeletionUnavailableException()
	{
		using AppDbContext db = CreateDbContext();

		User customer = CreateUser(1, Role.Client, "client@example.com");
		User freelancer = CreateUser(2, Role.Freelancer, "freelancer@example.com");

		db.Users.AddRange(customer, freelancer);
		db.Orders.Add(CreateOrder(
			orderId: 10,
			customer,
			freelancer,
			OrderStatus.In_Progress,
			completedAt: null));
		await db.SaveChangesAsync();

		AdminService service = CreateAdminService(db);

		Func<Task> act = async () => await service.DeleteUserAsync(freelancer.Id, CancellationToken.None);

		UserDeletionUnavailableException exception = (await act.Should()
			.ThrowAsync<UserDeletionUnavailableException>())
			.Which;

		exception.Message.Should().Contain("активные заказы");
	}

	[Fact]
	public async Task DeleteUserAsync_WhenUserHasOrderHistoryWithoutActiveOrders_ThrowsUserDeletionUnavailableException()
	{
		using AppDbContext db = CreateDbContext();

		User customer = CreateUser(1, Role.Client, "client@example.com");
		User freelancer = CreateUser(2, Role.Freelancer, "freelancer@example.com");

		db.Users.AddRange(customer, freelancer);
		db.Orders.Add(CreateOrder(
			orderId: 11,
			customer,
			freelancer,
			OrderStatus.Completed,
			completedAt: DateTime.UtcNow));
		await db.SaveChangesAsync();

		AdminService service = CreateAdminService(db);

		Func<Task> act = async () => await service.DeleteUserAsync(freelancer.Id, CancellationToken.None);

		UserDeletionUnavailableException exception = (await act.Should()
			.ThrowAsync<UserDeletionUnavailableException>())
			.Which;

		exception.Message.Should().Contain("истории заказов");
	}

	[Fact]
	public async Task DeleteUserAsync_WhenUserIsEmpty_DeletesUserAndTelegramTokens()
	{
		using AppDbContext db = CreateDbContext();

		User user = CreateUser(3, Role.Client, "empty@example.com");
		db.Users.Add(user);
		db.TelegramLinkTokens.Add(new TelegramLinkToken
		{
			Id = 1,
			UserId = user.Id,
			TokenHash = "hash",
			CreatedAt = DateTime.UtcNow,
			ExpiresAt = DateTime.UtcNow.AddMinutes(15),
			IsUsed = false
		});
		await db.SaveChangesAsync();

		AdminService service = CreateAdminService(db);

		User deletedUser = await service.DeleteUserAsync(user.Id, CancellationToken.None);

		deletedUser.Id.Should().Be(user.Id);
		(await db.Users.AnyAsync(item => item.Id == user.Id)).Should().BeFalse();
		(await db.TelegramLinkTokens.AnyAsync(item => item.UserId == user.Id)).Should().BeFalse();
	}

	[Fact]
	public async Task DeleteOrderAsync_WhenOrderHasProposals_ThrowsOrderDeletionUnavailableException()
	{
		using AppDbContext db = CreateDbContext();

		User customer = CreateUser(1, Role.Client, "client@example.com");
		User freelancer = CreateUser(2, Role.Freelancer, "freelancer@example.com");
		Order order = CreateOrder(20, customer, null, OrderStatus.Published, null);

		db.Users.AddRange(customer, freelancer);
		db.Orders.Add(order);
		db.Proposals.Add(new Proposal
		{
			Id = 30,
			OrderId = order.Id,
			Order = order,
			FreelancerId = freelancer.Id,
			Freelancer = freelancer,
			Price = 1000,
			Currency = Currency.RUB,
			EstimatedDays = 5,
			Status = ProposalStatus.pending,
			Message = "Proposal"
		});
		await db.SaveChangesAsync();

		AdminService service = CreateAdminService(db);

		Func<Task> act = async () => await service.DeleteOrderAsync(order.Id, CancellationToken.None);

		OrderDeletionUnavailableException exception = (await act.Should()
			.ThrowAsync<OrderDeletionUnavailableException>())
			.Which;

		exception.Message.Should().Contain("отклики");
	}

	[Fact]
	public async Task DeleteOrderAsync_WhenOrderHasAiHistory_ThrowsOrderDeletionUnavailableException()
	{
		using AppDbContext db = CreateDbContext();

		User customer = CreateUser(1, Role.Client, "client@example.com");
		Order order = CreateOrder(21, customer, null, OrderStatus.Published, null);

		db.Users.Add(customer);
		db.Orders.Add(order);
		db.AiConversations.Add(new AiConversation
		{
			Id = 31,
			OrderId = order.Id,
			Order = order,
			CreatedByUserId = customer.Id,
			CreatedByUser = customer,
			ConversationType = ConversationType.project_assistant
		});
		await db.SaveChangesAsync();

		AdminService service = CreateAdminService(db);

		Func<Task> act = async () => await service.DeleteOrderAsync(order.Id, CancellationToken.None);

		OrderDeletionUnavailableException exception = (await act.Should()
			.ThrowAsync<OrderDeletionUnavailableException>())
			.Which;

		exception.Message.Should().Contain("AI-диалогов");
	}

	[Fact]
	public async Task DeleteOrderAsync_WhenOrderHasSelectedFreelancer_ThrowsOrderDeletionUnavailableException()
	{
		using AppDbContext db = CreateDbContext();

		User customer = CreateUser(1, Role.Client, "client@example.com");
		User freelancer = CreateUser(2, Role.Freelancer, "freelancer@example.com");
		Order order = CreateOrder(22, customer, freelancer, OrderStatus.Published, null);

		db.Users.AddRange(customer, freelancer);
		db.Orders.Add(order);
		await db.SaveChangesAsync();

		AdminService service = CreateAdminService(db);

		Func<Task> act = async () => await service.DeleteOrderAsync(order.Id, CancellationToken.None);

		OrderDeletionUnavailableException exception = (await act.Should()
			.ThrowAsync<OrderDeletionUnavailableException>())
			.Which;

		exception.Message.Should().Contain("выбран исполнитель");
	}

	[Fact]
	public async Task DeleteOrderAsync_WhenOrderHasNoProposalsAiHistoryOrFreelancer_DeletesOrder()
	{
		using AppDbContext db = CreateDbContext();

		User customer = CreateUser(1, Role.Client, "client@example.com");
		Order order = CreateOrder(23, customer, null, OrderStatus.Published, null);

		db.Users.Add(customer);
		db.Orders.Add(order);
		await db.SaveChangesAsync();

		AdminService service = CreateAdminService(db);

		Order deletedOrder = await service.DeleteOrderAsync(order.Id, CancellationToken.None);

		deletedOrder.Id.Should().Be(order.Id);
		(await db.Orders.AnyAsync(item => item.Id == order.Id)).Should().BeFalse();
	}

	private static AdminService CreateAdminService(AppDbContext db)
	{
		IUserService userService = new UserService(db);
		IOrderService orderService = Mock.Of<IOrderService>();

		return new AdminService(userService, db, orderService);
	}

	private static AppDbContext CreateDbContext()
	{
		var options = new DbContextOptionsBuilder<AppDbContext>()
			.UseInMemoryDatabase(Guid.NewGuid().ToString())
			.Options;

		AppDbContext db = new(options);
		db.Database.EnsureCreated();
		return db;
	}

	private static User CreateUser(int id, Role role, string email)
	{
		return new User
		{
			Id = id,
			Email = email,
			FullName = $"User {id}",
			Role = role,
			CreatedAt = DateTime.UtcNow,
			LastSeenAt = DateTime.UtcNow
		};
	}

	private static Order CreateOrder(
		int orderId,
		User customer,
		User? freelancer,
		OrderStatus status,
		DateTime? completedAt)
	{
		return new Order
		{
			Id = orderId,
			CustomerId = customer.Id,
			Customer = customer,
			FreelancerId = freelancer?.Id,
			Freelancer = freelancer,
			Title = $"Order {orderId}",
			Description = "Description",
			TechnicalSpecification = "Spec",
			Status = status,
			WorkflowStage = WorkflowStage.review,
			CompletedAt = completedAt,
			UpdatedAt = DateTime.UtcNow
		};
	}
}
