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
    private readonly IAdminService _adminService;

	public AdminController(IAdminService adminService)
	{
        _adminService = adminService;
	}

	[HttpGet("users")]
	public async Task<IActionResult> GetUsers(CancellationToken ct)
	{
        List<User> users = await _adminService.GetUserAsync(ct);

		return Ok(users.Select(ToAdminUserDto));
	}

	[HttpGet("orders")]
	public async Task<IActionResult> GetOrders(CancellationToken ct)
	{
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

        User? user = await _adminService.BanUserAsync(userId, request, ct);

		return Ok(new
		{
			user = ToAdminUserDto(user)
		});
	}

	[HttpDelete("users/{userId:int}")]
	public async Task<IActionResult> DeleteUser(int userId, CancellationToken ct)
	{
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
        Order order = await _adminService.UpdateOrderAsync(orderId, request, ct);

		return Ok(new
		{
			order = ToOrderDto(order)
		});
	}

	[HttpDelete("orders/{orderId:int}")]
	public async Task<IActionResult> DeleteOrder(int orderId, CancellationToken ct)
	{
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
