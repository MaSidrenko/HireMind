using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using MyApp.Namespace;

namespace backend;

public class AdminService : IAdminService
{
	private readonly IUserService _userService;
	private readonly AppDbContext _db;
		private readonly IEmailSender _emailSender;
	private readonly ITelegramNotificationService _telegramNotificationService;
	public AdminService(IUserService userService, AppDbContext db, IEmailSender emailSender, ITelegramNotificationService telegramNotificationService)
	{
		_userService = userService;
		_db = db;
		_emailSender = emailSender;
		_telegramNotificationService = telegramNotificationService;
	}
	public async Task<User> BanUserAsync(int userId, AdminBanUserRequest request, CancellationToken ct)
	{
		User? user = await _userService.GetByIdAsync(userId, ct);

		if(user is null)
			throw new UserNotFoundException(userId);

		bool nextValue = request.IsBanned ?? request.Banned ?? !user.IsBanned;
		user.IsBanned = nextValue;

		await _db.SaveChangesAsync(ct);

		try
		{
			await _emailSender.SendEmailAsync(
				user.Email,
				"Уведомления от администратора HireMind!",
				"Вы забанены за нарушения правил сервиса"
			);
		} catch(Exception ex)
		{
			System.Console.WriteLine(ex.Message);
		}

		try
		{
			if(user.IsTelegramConnected && user.TelegramChatId != null)
				await _telegramNotificationService.SendContactNotificationAsync(
					user.TelegramChatId.Value,
					"Уведомление от администратора HireMind!\nВы забанены за нарушение правил сервиса"
				);
		}catch (Exception ex)
		{
			System.Console.WriteLine(ex.Message);
		}

		return user;
	}

	public async Task<User> ChangeUserDataAsync(int userId, AdminUpdateRequest request, CancellationToken ct)
	{
		User? user = await _userService.GetByIdAsync(userId, ct);
		
		if(user is null)
			throw new UserNotFoundException(userId);

		string currentEmail = NormalizeEmail(user.Email);
		string requestEmail = NormalizeEmail(request.Email);

		if(string.IsNullOrWhiteSpace(requestEmail))
			throw new InvalidEmailException();

		if(!string.Equals(currentEmail, requestEmail, StringComparison.OrdinalIgnoreCase))
			throw new EmailChangeWorkflowRequiredException();

		user.FullName = request.FullName.Trim();
		user.Role = request.Role;

		if(request.Contacts is not null)
		{
			user.Contacts ??= new Contacts();
			user.Contacts.Telegram = request.Contacts.Telegram?.Trim();
			user.Contacts.Phone = request.Contacts.Phone?.Trim();
		}

		user.CompanyName = request.Role == Role.Freelancer 
			? null : request.CompanyName?.Trim();

		user.Skills = request.Role == Role.Client 
			? new List<string>()
			: request.Skills;
		user.HourlyRate = request.Role == Role.Freelancer ? request.HourlyRate : 0;
		user.Currency = request.Role == Role.Freelancer ? request.Currency : Currency.RUB;

		await _db.SaveChangesAsync(ct);
		try
		{
			await _emailSender.SendEmailAsync(
				user.Email,
				"Уведомления от администратора HireMind!",
				$"Данные вашего аккаунта изменены администратором: {user.FullName}|{user.Role}|{user.Contacts.Telegram}" +
				$"|{user.Contacts.Phone}|{(request.Role == Role.Freelancer ? string.Join(",", user.Skills) : user.CompanyName)}" +
				$"|{(request.Role == Role.Freelancer ? user.HourlyRate : null)}|{(request.Role == Role.Freelancer ? user.Currency : null)}"
			);
		} catch(Exception ex)
		{
			System.Console.WriteLine(ex.Message);
		}

		try
		{
			if(user.IsTelegramConnected && user.TelegramChatId != null)
				await _telegramNotificationService.SendContactNotificationAsync(
					user.TelegramChatId.Value,
					$"Уведомления от администратора HireMind!\nДанные вашего аккаунта изменены администратором: {user.FullName}|{user.Role}|{user.Contacts.Telegram}" +
					$"|{user.Contacts.Phone}|{(request.Role == Role.Freelancer ? string.Join(",", user.Skills) : user.CompanyName)}" +
					$"|{(request.Role == Role.Freelancer ? user.HourlyRate : null)}|{(request.Role == Role.Freelancer ? user.Currency : null)}"
				);
		}catch (Exception ex)
		{
			System.Console.WriteLine(ex.Message);
		}
		return user;	
	}

	public async Task<Order> DeleteOrderAsync(int orderId, CancellationToken ct)
	{
		Order? order = await _db.Orders
			.Include(item => item.Proposals)
			.Include(item => item.AiConversations)
			.FirstOrDefaultAsync(item => item.Id == orderId, ct);

		if(order is null)
			throw new OrderNotFoundException(orderId);

		EnsureOrderCanBeDeleted(order);

		_db.Orders.Remove(order);
		await _db.SaveChangesAsync(ct);

		try
		{
			await _emailSender.SendEmailAsync(
				order.Customer.Email,
				"Уведомления от администратора HireMind!",
				$"Ваш заказ удален администратором за долгую не активность!"
			);
		} catch(Exception ex)
		{
			System.Console.WriteLine(ex.Message);
		}

		try
		{
			if(order.Customer.IsTelegramConnected && order.Customer.TelegramChatId != null)
				await _telegramNotificationService.SendContactNotificationAsync(
					order.Customer.TelegramChatId.Value,
					$"Уведомления от администратора HireMind!\nВаш заказ удален администратором за долгую не активность!" 
				);
		}catch (Exception ex)
		{
			System.Console.WriteLine(ex.Message);
		}

		return order;
	}

	public async Task<User> DeleteUserAsync(int userId, CancellationToken ct)
	{
		User? user = await _userService.GetByIdAsync(userId, ct);

		if(user is null)
			throw new UserNotFoundException(userId);

		await EnsureUserCanBeDeletedAsync(userId, ct);
		await CleanupAuxiliaryUserDataAsync(userId, ct);

		_db.Users.Remove(user);
		await _db.SaveChangesAsync(ct);

			try
		{
			await _emailSender.SendEmailAsync(
				user.Email,
				"Уведомления от администратора HireMind!",
				$"Ваш аккаунт удален за долгое бездействие!"
			);
		} catch(Exception ex)
		{
			System.Console.WriteLine(ex.Message);
		}

		try
		{
			if(user.IsTelegramConnected && user.TelegramChatId != null)
				await _telegramNotificationService.SendContactNotificationAsync(
					user.TelegramChatId.Value,
					$"Уведомления от администратора HireMind!\nВаш аккаунт удален за долгое бездействие!" 
				);
		}catch (Exception ex)
		{
			System.Console.WriteLine(ex.Message);
		}


		return user;
	}	

	public async Task<User> EmailChangeAsync(int userId, AdminEmailChangeRequest request, IEmailSender emailSender, CancellationToken ct)
	{
		User? user = await _userService.GetByIdAsync(userId, ct);

		if(user is null)
			throw new UserNotFoundException(userId);

		string newEmail = NormalizeEmail(request.NewEmail);

		if(string.IsNullOrWhiteSpace(newEmail))
			throw new InvalidEmailException();

		if(!new EmailAddressAttribute().IsValid(newEmail))
			throw new InvalidEmailException();

		string currentEmail = NormalizeEmail(user.Email);

		if(newEmail == currentEmail)
			throw new EmailMatchesCurrentException();

		bool emailExists = await _db.Users.AnyAsync(
			user =>
				user.Id != userId
				&& (
					user.Email.ToLower() == newEmail
					|| (user.PendingEmail != null && user.PendingEmail.ToLower() == newEmail)
				),
				ct
		);

		if(emailExists)
			throw new EmailExsistsException();

		string code = EmailCodeGenerator.GenerateCode();
		string? previousPendingEmail = user.PendingEmail;
		string? previousHash = user.EmailVerificationCodeHash;
		DateTime? previousExpiresAtUtc = user.EmailVerificationCodeExpiresAtUtc;
		int previousAttempts = user.EmailVerificationAttempts;

		user.PendingEmail = newEmail;
		user.EmailVerificationCodeHash = EmailCodeHasher.Hash(code);
		user.EmailVerificationCodeExpiresAtUtc = DateTime.UtcNow.AddHours(2);
		user.EmailVerificationAttempts = 0;

		await _db.SaveChangesAsync(ct);

				try
		{
			await _emailSender.SendEmailAsync(
				user.Email,
				"Уведомления от администратора HireMind!",
				$"По вашему запросу изменен ваш email"
			);
		} catch(Exception ex)
		{
			System.Console.WriteLine(ex.Message);
		}

		try
		{
			if(user.IsTelegramConnected && user.TelegramChatId != null)
				await _telegramNotificationService.SendContactNotificationAsync(
					user.TelegramChatId.Value,
					$"Уведомления от администратора HireMind!\nПо вашему запросу изменен ваш email" 
				);
		}catch (Exception ex)
		{
			System.Console.WriteLine(ex.Message);
		}

		try
		{
			await emailSender.SendEmailAsync(
				newEmail,
				"Подтверждение нового email",
					$"Ваш код подтверждения: {code}\n\nВведите его на странице подтверждения смены email."
			);
		}catch
		{
			user.PendingEmail = previousPendingEmail;
			user.EmailVerificationCodeHash = previousHash;
			user.EmailVerificationCodeExpiresAtUtc = previousExpiresAtUtc;
			user.EmailVerificationAttempts = previousAttempts;

			await _db.SaveChangesAsync(ct);

			throw new EmailChangeDeliveryFailedException();
		}

		return user;
	}

	public async Task<List<Order>> GetOrdersAsync(CancellationToken ct)
	{
		List<Order> orders = await _db.Orders.ToListAsync(ct);

		return orders;
	}

	public async Task<List<User>> GetUserAsync(CancellationToken ct)
	{
		List<User> users = await _db.Users
			.AsNoTracking()
			.OrderBy(user => user.FullName)
			.ToListAsync(ct);

		return users;
	}

	public async Task<User> PromoteToAdminAsync(int userId, CancellationToken ct)
	{
		User? user = await _userService.GetByIdAsync(userId, ct);

		if(user is null)
			throw new UserNotFoundException(userId);

		user.Role = Role.Admin;

		await _db.SaveChangesAsync(ct);
		
		try
		{
			await _emailSender.SendEmailAsync(
				user.Email,
				"Уведомления от администратора HireMind!",
				$"Ваши права повышены до администраторских"
			);
		} catch(Exception ex)
		{
			System.Console.WriteLine(ex.Message);
		}

		try
		{
			if(user.IsTelegramConnected && user.TelegramChatId != null)
				await _telegramNotificationService.SendContactNotificationAsync(
					user.TelegramChatId.Value,
					$"Уведомления от администратора HireMind!\nВаши права повышены до администраторских" 
				);
		}catch (Exception ex)
		{
			System.Console.WriteLine(ex.Message);
		}

		return user;
	}

	public async Task<Order> UpdateOrderAsync(int orderId, OrderUpdateRequest request, CancellationToken ct)
	{
		Order? order = await _db.Orders
				.Include(o => o.Customer)
				.Include(o => o.Freelancer)
				.Include(o => o.Proposals)
					.ThenInclude(p => p.Freelancer)
				.Include(o => o.ClarificationQuestions)
				.Include(o => o.ScopeItems)
				.Include(o => o.DoneCriteria)
				.Include(o => o.Risks)
				.FirstOrDefaultAsync(o => o.Id == orderId, ct);

		if(order is null)
			throw new OrderNotFoundException(orderId);

		order.Title = request.Title.Trim();
		order.Description = request.RawDescription.Trim();
		order.TechnicalSpecification = request.TechnicalSpecification.Trim();
		order.Category = request.Category;
		order.MinPrice = request.BudgetMin;
		order.MaxPrice = request.BudgetMax;
		order.Currency = request.Currency;
		order.Payment = request.BudgetType;
		order.Status = request.Status;
		// order.WorkflowStage = request.WorkflowStage;
		order.Skills = request.Skills;
		// order.AiGenerated = request.AiGenerated;
		// order.ReadinessScore = request.ReadinessScore;
		// order.BriefSections = request.BriefSections;
		// order.ClarificationQuestions = request.ClarificationQuestions;
		// order.ScopeItems = request.ScopeItems;
		// order.DoneCriteria = request.DoneCriteria;
		// order.Risks = request.Risks;
		order.UpdatedAt = DateTime.UtcNow;

		if (order.Customer is not null)
		{
			order.Customer.CompanyName = request.CompanyName?.Trim();
		}

		await _db.SaveChangesAsync(ct);

		
		try
		{
			await _emailSender.SendEmailAsync(
				order.Customer.Email,
				"Уведомления от администратора HireMind!",
				"Ваш заказ изменен администратором! Новые данные:" +
				$"{order.Title}|{order.Description}|{order.TechnicalSpecification}" +
				$"|{order.Category}|{order.MinPrice}|{order.MaxPrice}|{order.Currency}" +
				$"|{order.Payment}|{order.Status}|{string.Join(",", order.Skills)}"
			);

			if(order.Freelancer != null)
			{
				await _emailSender.SendEmailAsync(
					order.Freelancer.Email,
					"Уведомления от администратора HireMind!",
					"Заказ над которым вы работаете изменен администратором! Новые данные:" +
					$"{order.Title}|{order.Description}|{order.TechnicalSpecification}" +
					$"|{order.Category}|{order.MinPrice}|{order.MaxPrice}|{order.Currency}" +
					$"|{order.Payment}|{order.Status}|{string.Join(",", order.Skills)}"
				);
			}
		} catch(Exception ex)
		{
			System.Console.WriteLine(ex.Message);
		}

		try
		{
			if(order.Customer.IsTelegramConnected && order.Customer.TelegramChatId != null)
				await _telegramNotificationService.SendContactNotificationAsync(
					order.Customer.TelegramChatId.Value,
					$"Уведомления от администратора HireMind!\nВаш заказ изменен администратором! Новые данные:" +
				$"{order.Title}|{order.Description}|{order.TechnicalSpecification}" +
				$"|{order.Category}|{order.MinPrice}|{order.MaxPrice}|{order.Currency}" +
				$"|{order.Payment}|{order.Status}|{string.Join(",", order.Skills)}"
			);

			if(order.Freelancer != null)
			{
				if(order.Freelancer.IsTelegramConnected && order.Freelancer.TelegramChatId != null)
				await _telegramNotificationService.SendContactNotificationAsync(
					order.Freelancer.TelegramChatId.Value,
					$"Уведомления от администратора HireMind!\nЗаказ над которым вы работаете изменен администратором! Новые данные:" +
				$"{order.Title}|{order.Description}|{order.TechnicalSpecification}" +
				$"|{order.Category}|{order.MinPrice}|{order.MaxPrice}|{order.Currency}" +
				$"|{order.Payment}|{order.Status}|{string.Join(",", order.Skills)}"
			);
			}
		}catch (Exception ex)
		{
			System.Console.WriteLine(ex.Message);
		}


		return order;
	}

	private static string NormalizeEmail(string? email)
		=> email?.Trim().ToLowerInvariant() ?? string.Empty;

	private static void EnsureOrderCanBeDeleted(Order order)
	{
		if (order.FreelancerId.HasValue)
		{
			throw new OrderDeletionUnavailableException(
				"Нельзя удалить заказ, пока у него выбран исполнитель."
			);
		}

		if (order.Proposals.Count > 0)
		{
			throw new OrderDeletionUnavailableException(
				"Нельзя удалить заказ, пока у него есть отклики."
			);
		}

		if (order.AiConversations.Count > 0)
		{
			throw new OrderDeletionUnavailableException(
				"Нельзя удалить заказ, пока у него есть история AI-диалогов."
			);
		}
	}

	private async Task EnsureUserCanBeDeletedAsync(int userId, CancellationToken ct)
	{
		bool hasActiveOrders = await _db.Orders
			.AsNoTracking()
			.AnyAsync(
				order =>
					(order.CustomerId == userId || order.FreelancerId == userId)
					&& order.Status != OrderStatus.Completed
					&& order.Status != OrderStatus.Cancelled
					&& order.Status != OrderStatus.Archived,
				ct);

		if (hasActiveOrders)
		{
			throw new UserDeletionUnavailableException(
				"Нельзя удалить пользователя, пока у него есть активные заказы."
			);
		}

		bool hasOrderHistory = await _db.Orders
			.AsNoTracking()
			.AnyAsync(
				order => order.CustomerId == userId || order.FreelancerId == userId,
				ct);

		if (hasOrderHistory)
		{
			throw new UserDeletionUnavailableException(
				"Hard delete доступен только для пустых пользователей без истории заказов."
			);
		}

		bool hasProposals = await _db.Proposals
			.AsNoTracking()
			.AnyAsync(proposal => proposal.FreelancerId == userId, ct);

		if (hasProposals)
		{
			throw new UserDeletionUnavailableException(
				"Нельзя удалить пользователя, пока у него есть отклики на заказы."
			);
		}

		bool hasContactRequests = await _db.Contacts
			.AsNoTracking()
			.AnyAsync(contact => contact.ClientId == userId || contact.FreelancerId == userId, ct);

		if (hasContactRequests)
		{
			throw new UserDeletionUnavailableException(
				"Нельзя удалить пользователя, пока у него есть заявки на контакт."
			);
		}

		bool hasAiConversations = await _db.AiConversations
			.AsNoTracking()
			.AnyAsync(conversation => conversation.CreatedByUserId == userId, ct);

		if (hasAiConversations)
		{
			throw new UserDeletionUnavailableException(
				"Нельзя удалить пользователя, пока у него есть история AI-диалогов."
			);
		}
	}

	private async Task CleanupAuxiliaryUserDataAsync(int userId, CancellationToken ct)
	{
		List<TelegramLinkToken> linkTokens = await _db.TelegramLinkTokens
			.Where(item => item.UserId == userId)
			.ToListAsync(ct);

		if (linkTokens.Count > 0)
		{
			_db.TelegramLinkTokens.RemoveRange(linkTokens);
		}
	}
}
