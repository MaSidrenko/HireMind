using System.Security.Claims;
using backend;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MyApp.Namespace;

[Route("api/v1/[controller]")]
[ApiController]
public class OrderController : ControllerBase
{
	private readonly IOrderService _orderService;

	public OrderController(IOrderService orderService)
	{
		_orderService = orderService;
	}

	[HttpGet("get-by-id/{id:int}")]
	public async Task<IActionResult> GetById(int id, CancellationToken ct)
	{
		Order order = await _orderService.GetByIdAsync(id, ct);

		return Ok(ToDto(order));
	}

	[HttpGet("get-all")]
	public async Task<IActionResult> GetOrders(CancellationToken ct)
	{
		List<OrderListItemDto> orders = await _orderService.GetListAsync(ct);

		return Ok(orders);
	}
	[HttpGet("get-accepted-projects")]
	public async Task<IActionResult> GetAccteptedProjectList(CancellationToken ct)
	{
		List<OrderListItemDto> orders = await _orderService.GetAccteptedProjectListAsync(ct);

		return Ok(orders);
	}

	[Authorize(Roles = "Client")]
	[HttpPost("create")]
	public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request, CancellationToken ct)
	{
		string? userIdValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

		if (!int.TryParse(userIdValue, out int userId))
		{
			return Unauthorized();
		}

		Order createdOrder = await _orderService.CreateOrderAsync(request, userId, ct);
		return Ok(ToDto(createdOrder));
	}

	[Authorize(Roles = "Client")]
	[HttpPut("update/{id:int}")]
	public async Task<IActionResult> UpdateOrder(
		int id,
		[FromBody] UpdateOrderRequest request,
		CancellationToken ct)
	{
		if (!TryGetUserId(out int userId))
		{
			return Unauthorized();
		}

		if (request.BudgetMin < 0 || request.BudgetMax < 0 || request.BudgetMin > request.BudgetMax)
		{
			return BadRequest(new
			{
				message = "Некорректные значения цен."
			});
		}
		Order order = await _orderService.UpdateOrderAsync(id, userId, request, ct);

		return Ok(ToDto(order));
	}

	[Authorize(Roles = "Freelancer")]
	[HttpPut("Proposal/create")]
	public async Task<IActionResult> RespondToOrder([FromBody] CreateProposalRequest request, CancellationToken ct)
	{
		if (!TryGetUserId(out int userId))
		{
			return Unauthorized();
		}

		if (request.OrderId <= 0
			|| request.Price <= 0
			|| request.EstimatedDays <= 0
			|| string.IsNullOrWhiteSpace(request.Message)
			|| request.Message.Trim().Length < 20)
		{
			return BadRequest(new
			{
				message = "Заполните сообщение, стоимость и срок отклика."
			});
		}

		Order order = await _orderService.RespondToOrderAsync(userId, request, ct);

		return Ok(ToDto(order));
	}

	[Authorize(Roles = "Client")]
	[HttpPut("Proposal/{proposalId:int}/accept")]
	public async Task<IActionResult> AcceptProposal(int proposalId, CancellationToken ct)
	{
		if (!TryGetUserId(out int userId))
		{
			return Unauthorized();
		}

		Order order = await _orderService.AcceptProposalAsync(proposalId,userId, ct);

		return Ok(ToDto(order));
	}

	[Authorize(Roles = "Freelancer")]
	[HttpPut("Proposal/{proposalId:int}/withdraw")]
	public async Task<IActionResult> WithdrawProposal(int proposalId, CancellationToken ct)
	{
		if (!TryGetUserId(out int userId))
		{
			return Unauthorized();
		}

		Order order = await _orderService.WithdrawProposalAsync(proposalId, userId, ct);

		return Ok(ToDto(order));
	}

	[Authorize(Roles = "Client")]
	[HttpPut("{orderId:int}/approval/client")]
	public async Task<IActionResult> UpdateClientApproval(
		int orderId,
		[FromBody] UpdateApprovalRequest request,
		CancellationToken ct)
	{
		if (!TryGetUserId(out int userId))
		{
			return Unauthorized();
		}

		Order order = await _orderService.UpdateClientApproval(orderId, userId, request, ct);

		return Ok(ToDto(order));
	}

	[Authorize(Roles = "Freelancer")]
	[HttpPut("{orderId:int}/approval/freelancer")]
	public async Task<IActionResult> UpdateFreelancerApproval(
		int orderId,
		[FromBody] UpdateApprovalRequest request,
		CancellationToken ct)
	{
		if (!TryGetUserId(out int userId))
		{
			return Unauthorized();
		}

		Order order = await _orderService.UpdateFreelancerApprovalAsync(orderId, userId, request, ct);

		return Ok(ToDto(order));
	}

	[Authorize]
	[HttpPut("{orderId:int}/rating")]
	public async Task<IActionResult> RateOrder(
		int orderId,
		[FromBody] UpdateOrderRatingRequest request,
		CancellationToken ct)
	{
		if (!TryGetUserId(out int userId))
		{
			return Unauthorized();
		}

		if (request.Score is < 1 or > 5)
		{
			return BadRequest(new
			{
				message = "Оценка должна быть от 1 до 5."
			});
		}

		Order order = await _orderService.RateOrderAsync(orderId, userId, request, ct);

		return Ok(ToDto(order));
	}

	private bool TryGetUserId(out int userId)
	{
		string? userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
		return int.TryParse(userIdValue, out userId);
	}
	private static OrderListItemDto ToDto(Order order)
	{
		ArgumentNullException.ThrowIfNull(order);

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
