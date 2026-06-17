using System.ComponentModel.DataAnnotations;
using backend;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MyApp.Namespace;

[Authorize(Roles = "Admin")]
[Route("api/v1/admin")]
[ApiController]
public class AdminController : ControllerBase
{
	// private readonly AppDbContext _db;
    private readonly IAdminService _adminService;

	public AdminController(IAdminService adminService)
	{
		// _db = context;
        _adminService = adminService;
	}

	[HttpGet("users")]
	public async Task<IActionResult> GetUsers(CancellationToken ct)
	{
		// List<User> users = await _db.Users
		// 	.AsNoTracking()
		// 	.OrderBy(user => user.FullName)
		// 	.ToListAsync(ct);

        List<User> users = await _adminService.GetUserAsync(ct);

		return Ok(users.Select(ToAdminUserDto));
	}

	[HttpGet("orders")]
	public async Task<IActionResult> GetOrders(CancellationToken ct)
	{
		// List<Order> orders = await _db.Orders
		// 	.AsNoTracking()
		// 	.Include(order => order.Customer)
		// 	.Include(order => order.Freelancer)
		// 	.Include(order => order.Proposals)
		// 		.ThenInclude(proposal => proposal.Freelancer)
		// 	.Include(order => order.ClarificationQuestions)
		// 	.Include(order => order.ScopeItems)
		// 	.Include(order => order.DoneCriteria)
		// 	.Include(order => order.Risks)
		// 	.OrderByDescending(order => order.UpdatedAt)
		// 	.ToListAsync(ct);
        List<Order> orders = await _adminService.GetOrdersAsync(ct);
		List<OrderListItemDto> orderListItemDtos = new();

		foreach(Order order in orders)
			orderListItemDtos.Add(ToOrderDto(order));

		return Ok(orderListItemDtos);
	}

	[HttpPut("users/{userId:int}")]
	public async Task<IActionResult> UpdateAdminRequest(
		int userId,
		[FromBody] AdminUpdateRequest request,
		CancellationToken ct)
	{
		// User? user = await _db.Users.FirstOrDefaultAsync(item => item.Id == userId, ct);

		// if (user is null)
		// {
		// 	return NotFound(new
		// 	{
		// 		message = "Пользователь с таким ID не найден"
		// 	});
		// }

		// string currentEmail = NormalizeEmail(user.Email);
		// string requestedEmail = NormalizeEmail(request.Email);

		// if (string.IsNullOrWhiteSpace(requestedEmail))
		// {
		// 	return BadRequest(new
		// 	{
		// 		message = "Email не может быть пустым"
		// 	});
		// }

		// if (!string.Equals(currentEmail, requestedEmail, StringComparison.Ordinal))
		// {
		// 	return BadRequest(new
		// 	{
		// 		message = "Для смены email используйте отдельный сценарий подтверждения."
		// 	});
		// }

		// user.FullName = request.FullName.Trim();
		// user.Role = request.Role;

		// if (request.Contacts is not null)
		// {
		// 	user.Contacts ??= new Contacts();
		// 	user.Contacts.Telegram = request.Contacts.Telegram?.Trim();
		// 	user.Contacts.Phone = request.Contacts.Phone?.Trim();
		// }

		// user.CompanyName = request.Role == Role.Freelancer
		// 	? null
		// 	: request.CompanyName?.Trim();
		// user.Skills = request.Role == Role.Freelancer
		// 	? request.Skills
		// 	: new List<string>();
		// user.HourlyRate = request.Role == Role.Freelancer ? request.HourlyRate : 0;
		// user.Currency = request.Role == Role.Freelancer ? request.Currency : Currency.RUB;

		// await _db.SaveChangesAsync(ct);
        
        User user = await _adminService.ChangeUserDataAsync(userId, request, ct);

		return Ok(new
		{
			user = ToAdminUserDto(user)
		});
	}

	[HttpPost("users/{userId:int}/email-change-request")]
	public async Task<IActionResult> RequestEmailChange(
		int userId,
		[FromBody] AdminEmailChangeRequest request,
		[FromServices] IEmailSender emailSender,
		CancellationToken ct)
	{
		// User? user = await _db.Users.FirstOrDefaultAsync(item => item.Id == userId, ct);

		// if (user is null)
		// {
		// 	return NotFound(new
		// 	{
		// 		message = "Пользователь с таким ID не найден"
		// 	});
		// }

		// string newEmail = NormalizeEmail(request.NewEmail);

		// if (string.IsNullOrWhiteSpace(newEmail))
		// {
		// 	return BadRequest(new
		// 	{
		// 		message = "Email не может быть пустым"
		// 	});
		// }

		// if (!new EmailAddressAttribute().IsValid(newEmail))
		// {
		// 	return BadRequest(new
		// 	{
		// 		message = "Введите корректный email"
		// 	});
		// }

		// string currentEmail = NormalizeEmail(user.Email);

		// if (newEmail == currentEmail)
		// {
		// 	return BadRequest(new
		// 	{
		// 		message = "Новый email совпадает с текущим"
		// 	});
		// }

		// bool emailExists = await _db.Users.AnyAsync(
		// 	item =>
		// 		item.Id != userId
		// 		&& (
		// 			item.Email.ToLower() == newEmail
		// 			|| (item.PendingEmail != null && item.PendingEmail.ToLower() == newEmail)
		// 		),
		// 	ct);

		// if (emailExists)
		// {
		// 	return Conflict(new
		// 	{
		// 		message = "Этот email уже используется"
		// 	});
		// }

		// string code = EmailCodeGenerator.GenerateCode();
		// string? previousPendingEmail = user.PendingEmail;
		// string? previousHash = user.EmailVerificationCodeHash;
		// DateTime? previousExpiresAtUtc = user.EmailVerificationCodeExpiresAtUtc;
		// int previousAttempts = user.EmailVerificationAttempts;

		// user.PendingEmail = newEmail;
		// user.EmailVerificationCodeHash = EmailCodeHasher.Hash(code);
		// user.EmailVerificationCodeExpiresAtUtc = DateTime.UtcNow.AddHours(2);
		// user.EmailVerificationAttempts = 0;

		// await _db.SaveChangesAsync(ct);

		// try
		// {
		// 	await emailSender.SendEmailAsync(
		// 		newEmail,
		// 		"Подтверждение нового email",
		// 		$"Ваш код подтверждения: {code}\n\nВведите его на странице подтверждения смены email."
		// 	);
		// }
		// catch
		// {
		// 	user.PendingEmail = previousPendingEmail;
		// 	user.EmailVerificationCodeHash = previousHash;
		// 	user.EmailVerificationCodeExpiresAtUtc = previousExpiresAtUtc;
		// 	user.EmailVerificationAttempts = previousAttempts;

		// 	await _db.SaveChangesAsync(ct);

		// 	return StatusCode(StatusCodes.Status500InternalServerError, new
		// 	{
		// 		message = "Не удалось отправить код подтверждения. Попробуйте позже."
		// 	});
		// }
        User user = await _adminService.EmailChangeAsync(userId, request, emailSender, ct);
		
        return Ok(new
		{
			message = "На новый email отправлен код подтверждения",
			user = ToAdminUserDto(user)
		});
	}

	[HttpPut("users/{userId:int}/promote")]
	public async Task<IActionResult> PromoteToAdmin(int userId, CancellationToken ct)
	{
		// User? user = await _db.Users.FirstOrDefaultAsync(item => item.Id == userId, ct);

		// if (user is null)
		// {
		// 	return NotFound(new
		// 	{
		// 		message = "Пользователь с таким ID не найден"
		// 	});
		// }

		// user.Role = Role.Admin;
		// await _db.SaveChangesAsync(ct);
        User user = await _adminService.PromoteToAdminAsync(userId, ct);

		return Ok(new
		{
			user = ToAdminUserDto(user)
		});
	}

	[HttpPut("users/{userId:int}/ban")]
	public async Task<IActionResult> BanUser(
		int userId,
		[FromBody] AdminBanUserRequest request,
		CancellationToken ct)
	{
		// User? user = await _db.Users.FirstOrDefaultAsync(item => item.Id == userId, ct);

		// if (user is null)
		// {
		// 	return NotFound(new
		// 	{
		// 		message = "Пользователь с таким ID не найден"
		// 	});
		// }

		// bool nextValue = request.IsBanned ?? request.Banned ?? !user.IsBanned;
		// user.IsBanned = nextValue;

		// await _db.SaveChangesAsync(ct);

        User? user = await _adminService.BanUserAsync(userId, request, ct);

		return Ok(new
		{
			user = ToAdminUserDto(user)
		});
	}

	[HttpDelete("users/{userId:int}")]
	public async Task<IActionResult> DeleteUser(int userId, CancellationToken ct)
	{
		// User? user = await _db.Users.FirstOrDefaultAsync(item => item.Id == userId, ct);

		// if (user is null)
		// {
		// 	return NotFound(new
		// 	{
		// 		message = "Пользователь с таким ID не найден"
		// 	});
		// }

		// _db.Users.Remove(user);
		// await _db.SaveChangesAsync(ct);
        User user = await _adminService.DeleteUserAsync(userId, ct);

		return Ok(new
		{
			message = $"Пользователь {user.FullName} удалён"
		});
	}

	[HttpPut("orders/{orderId:int}")]
	public async Task<IActionResult> UpdateOrder(
		int orderId,
		[FromBody] OrderUpdateRequest request,
		CancellationToken ct)
	{
		// Order? order = await _db.Orders
		// 	.Include(item => item.Customer)
		// 	.Include(item => item.Freelancer)
		// 	.Include(item => item.Proposals)
		// 		.ThenInclude(proposal => proposal.Freelancer)
		// 	.Include(item => item.ClarificationQuestions)
		// 	.Include(item => item.ScopeItems)
		// 	.Include(item => item.DoneCriteria)
		// 	.Include(item => item.Risks)
		// 	.FirstOrDefaultAsync(item => item.Id == orderId, ct);

		// if (order is null)
		// {
		// 	return NotFound(new
		// 	{
		// 		message = "Заказ с таким ID не найден"
		// 	});
		// }

		// order.Title = request.Title.Trim();
		// order.Description = request.RawDescription.Trim();
		// order.TechnicalSpecification = request.TechnicalSpecification.Trim();
		// order.Category = request.Category;
		// order.MinPrice = request.BudgetMin;
		// order.MaxPrice = request.BudgetMax;
		// order.Currency = request.Currency;
		// order.Payment = request.BudgetType;
		// order.Status = request.Status;
		// order.WorkflowStage = request.WorkflowStage;
		// order.Skills = request.Skills;
		// order.AiGenerated = request.AiGenerated;
		// order.ReadinessScore = request.ReadinessScore;
		// order.BriefSections = request.BriefSections;
		// order.ClarificationQuestions = request.ClarificationQuestions;
		// order.ScopeItems = request.ScopeItems;
		// order.DoneCriteria = request.DoneCriteria;
		// order.Risks = request.Risks;
		// order.UpdatedAt = DateTime.UtcNow;

		// if (order.Customer is not null)
		// {
		// 	order.Customer.CompanyName = request.CompanyName?.Trim();
		// }

		// await _db.SaveChangesAsync(ct);
        Order order = await _adminService.UpdateOrderAsync(orderId, request, ct);

		return Ok(new
		{
			order = ToOrderDto(order)
		});
	}

	[HttpDelete("orders/{orderId:int}")]
	public async Task<IActionResult> DeleteOrder(int orderId, CancellationToken ct)
	{
		// Order? order = await _db.Orders.FirstOrDefaultAsync(item => item.Id == orderId, ct);

		// if (order is null)
		// {
		// 	return NotFound(new
		// 	{
		// 		message = "Заказ с таким ID не найден"
		// 	});
		// }

		// _db.Orders.Remove(order);
		// await _db.SaveChangesAsync(ct);

        Order order = await _adminService.DeleteOrderAsync(orderId, ct);

		return Ok(new
		{
			message = $"Заказ «{order.Title}» удалён"
		});
	}
	private static AdminUserDto ToAdminUserDto(User user)
	{
		return new AdminUserDto
		{
			Id = user.Id,
			FullName = user.FullName,
			Email = user.Email,
			PendingEmail = user.PendingEmail,
			Role = user.Role,
			Rating = user.Rating,
			Contacts = user.Contacts,
			CompanyName = user.CompanyName,
			Skills = user.Skills,
			HourlyRate = user.Role == Role.Freelancer ? user.HourlyRate : null,
			Currency = user.Role == Role.Freelancer ? user.Currency : null,
			CompletedOrders = user.Role == Role.Freelancer ? user.CompletedOrders : null,
			IsOnline = user.IsOnline,
			IsTelegramConnected = user.IsTelegramConnected,
			IsBanned = user.IsBanned,
			IsEmailConfirmed = user.isEmailConfirmed
		};
	}

	private static OrderListItemDto ToOrderDto(Order order)
	{
		string description = order.Description ?? string.Empty;
		List<Proposal> proposals = order.Proposals ?? new();
		List<ClarificationQuestion> clarificationQuestions = order.ClarificationQuestions ?? new();
		List<ScopeItem> scopeItems = order.ScopeItems ?? new();
		List<DoneCriterion> doneCriteria = order.DoneCriteria ?? new();
		List<RiskItem> risks = order.Risks ?? new();

		return new OrderListItemDto
		{
			Id = order.Id,
			HirerId = order.CustomerId,
			HirerName = order.Customer?.FullName ?? string.Empty,
			CompanyName = order.Customer?.CompanyName ?? string.Empty,
			HirerRating = order.Customer?.Rating ?? 0,
			SelectedFreelancerId = order.FreelancerId,
			SelectedFreelancerName = order.Freelancer?.FullName,
			SelectedFreelancerRating = order.Freelancer?.Rating,
			Title = order.Title,
			ShortDescription = description.Length > 150
				? description.Substring(0, 150)
				: description,
			RawDescription = description,
			TechnicalSpecification = order.TechnicalSpecification,
			Category = order.Category,
			BudgetMin = order.MinPrice,
			BudgetMax = order.MaxPrice,
			Currency = order.Currency,
			BudgetType = order.Payment,
			Skills = order.Skills ?? new List<string>(),
			Status = order.Status,
			WorkflowStage = order.WorkflowStage,
			ProposalsCount = proposals.Count,
			Proposals = proposals
				.OrderByDescending(proposal => proposal.CreatedAt)
				.Select(proposal => new ProjectProposalDto
				{
					Id = proposal.Id,
					ProjectId = proposal.OrderId,
					FreelancerId = proposal.FreelancerId,
					FreelancerName = proposal.Freelancer?.FullName ?? string.Empty,
					Message = proposal.Message,
					Price = proposal.Price,
					Currency = proposal.Currency,
					EstimatedDays = proposal.EstimatedDays,
					Status = proposal.Status,
					CreatedAt = proposal.CreatedAt
				})
				.ToList(),
			PublishedAt = order.PublishedAt,
			CompletedAt = order.CompletedAt,
			UpdatedAt = order.UpdatedAt,
			AiGenerated = order.AiGenerated,
			ClientDoneApproved = order.ClientDoneApproved,
			FreelancerDoneApproved = order.FreelancerDoneApproved,
			ReadinessScore = order.ReadinessScore,
			BriefSections = new BriefSectionsDto
			{
				Goal = order.BriefSections?.Goal ?? string.Empty,
				Audience = order.BriefSections?.Audience ?? string.Empty,
				Screens = order.BriefSections?.Screens ?? string.Empty,
				Features = order.BriefSections?.Features ?? string.Empty,
				Content = order.BriefSections?.Content ?? string.Empty,
				Design = order.BriefSections?.Design ?? string.Empty,
				Constraints = order.BriefSections?.Constraints ?? string.Empty,
				OpenQuestions = order.BriefSections?.OpenQuestions ?? string.Empty
			},
			ClarificationQuestions = clarificationQuestions
				.Select(question => new ClarificationQuestionDto
				{
					Id = question.Id,
					Question = question.Question,
					Importance = question.Importance,
					Answer = question.Answer,
					Options = question.Options ?? new List<string>()
				})
				.ToList(),
			ScopeItems = scopeItems
				.Select(scopeItem => new ScopeItemDto
				{
					Id = scopeItem.Id,
					Title = scopeItem.Title,
					Description = scopeItem.Description,
					Bucket = scopeItem.Bucket
				})
				.ToList(),
			DoneCriteria = doneCriteria
				.Select(doneCriterion => new DoneCriterionDto
				{
					Id = doneCriterion.Id,
					Text = doneCriterion.Text,
					Checked = doneCriterion.Checked
				})
				.ToList(),
			Risks = risks
				.Select(risk => new RiskItemDto
				{
					Id = risk.Id,
					Title = risk.Title,
					Level = risk.Level,
					Impact = risk.Impact,
					Action = risk.Action,
					Resolved = risk.Resolved
				})
				.ToList(),
			Approvals = new ApprovalsDto
			{
				Client = order.ClientApproved,
				Freelancer = order.FreelancerApproved
			},
			ClientRatingByFreelancer = order.ClientRatingByFreelancer,
			FreelancerRatingByClient = order.FreelancerRatingByClient
		};
	}
}

public sealed class AdminUserDto
{
	public int Id { get; set; }
	public string FullName { get; set; } = string.Empty;
	public string Email { get; set; } = string.Empty;
	public string? PendingEmail { get; set; }
	public Role Role { get; set; }
	public double Rating { get; set; }
	public Contacts? Contacts { get; set; }
	public string? CompanyName { get; set; }
	public List<string> Skills { get; set; } = new();
	public decimal? HourlyRate { get; set; }
	public Currency? Currency { get; set; }
	public int? CompletedOrders { get; set; }
	public bool IsOnline { get; set; }
	public bool IsTelegramConnected { get; set; }
	public bool IsBanned { get; set; }
	public bool IsEmailConfirmed { get; set; }
}

public sealed class AdminEmailChangeRequest
{
	public string NewEmail { get; set; } = string.Empty;
}

public sealed class AdminBanUserRequest
{
	public bool? IsBanned { get; set; }
	public bool? Banned { get; set; }
}

public class OrderUpdateRequest
{
	public string Title { get; set; } = string.Empty;
	public string RawDescription { get; set; } = string.Empty;
	public string TechnicalSpecification { get; set; } = string.Empty;
	public Category Category { get; set; }
	public decimal BudgetMin { get; set; }
	public decimal BudgetMax { get; set; }
	public Currency Currency { get; set; }
	public Payment BudgetType { get; set; }
	public OrderStatus Status { get; set; }
	public WorkflowStage WorkflowStage { get; set; }
	public List<string> Skills { get; set; } = new();
	public bool AiGenerated { get; set; }
	public int ReadinessScore { get; set; }
	public OrderBriefSections? BriefSections { get; set; }
	public List<ClarificationQuestion> ClarificationQuestions { get; set; } = new();
	public List<ScopeItem> ScopeItems { get; set; } = new();
	public List<DoneCriterion> DoneCriteria { get; set; } = new();
	public List<RiskItem> Risks { get; set; } = new();
	public string? CompanyName { get; set; }
}

public class AdminUpdateRequest
{
	public string FullName { get; set; } = string.Empty;
	public string Email { get; set; } = string.Empty;
	public Role Role { get; set; }
	public AdminContactsUpdateRequest? Contacts { get; set; }
	public string? CompanyName { get; set; }
	public List<string> Skills { get; set; } = new();
	public decimal HourlyRate { get; set; }
	public Currency Currency { get; set; }
}

public class AdminContactsUpdateRequest
{
	public string? Telegram { get; set; }
	public string? Phone { get; set; }
}
