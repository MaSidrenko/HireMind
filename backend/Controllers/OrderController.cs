using System.Security.Claims;
using backend;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MyApp.Namespace;

[Route("api/[controller]")]
[ApiController]
public class OrderController : ControllerBase
{
	private readonly AppDbContext _db;

	public OrderController(AppDbContext context)
	{
		_db = context;
	}

	[HttpGet("get-by-id/{id:int}")]
	public async Task<IActionResult> GetById(int id, CancellationToken ct)
	{
		Order? order = await LoadOrderGraphAsync(id, ct, asNoTracking: true);

		if (order is null)
		{
			return NotFound(new
			{
				message = "Заказ не найден."
			});
		}

		return Ok(ToDto(order));
	}

	[HttpGet("get-all")]
	public async Task<IActionResult> GetOrders(CancellationToken ct)
	{
		List<OrderListItemDto> orders = await _db.Orders
			.AsNoTracking()
			.Select(order => new OrderListItemDto
			{
				Id = order.Id,
				HirerId = order.CustomerId,
				HirerName = order.Customer.FullName,
				CompanyName = order.Customer.CompanyName,
				SelectedFreelancerId = order.FreelancerId,
				SelectedFreelancerName = order.Freelancer != null
					? order.Freelancer.FullName
					: null,
				Title = order.Title,
				ShortDescription = order.Description.Length > 150
					? order.Description.Substring(0, 150)
					: order.Description,
				RawDescription = order.Description,
				TechnicalSpecification = order.TechnicalSpecification,
				Category = order.Category,
				BudgetMin = order.MinPrice,
				BudgetMax = order.MaxPrice,
				Currency = order.Currency,
				BudgetType = order.Payment,
				Skills = order.Skills,
				Status = order.Status,
				WorkflowStage = order.WorkflowStage,
				ProposalsCount = order.Proposals.Count,
				Proposals = order.Proposals
					.OrderByDescending(proposal => proposal.CreatedAt)
					.Select(proposal => new ProjectProposalDto
					{
						Id = proposal.Id,
						ProjectId = proposal.OrderId,
						FreelancerId = proposal.FreelancerId,
						FreelancerName = proposal.Freelancer.FullName,
						Message = proposal.Message,
						Price = proposal.Price,
						Currency = proposal.Currency,
						EstimatedDays = proposal.EstimatedDays,
						Status = proposal.Status,
						CreatedAt = proposal.CreatedAt
					})
					.ToList(),
				PublishedAt = order.PublishedAt,
				UpdatedAt = order.UpdatedAt,
				AiGenerated = order.AiGenerated,
				ReadinessScore = order.ReadinessScore
			})
			.ToListAsync(ct);

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

		User? customer = await _db.Users.FindAsync(new object[] { userId }, ct);

		if (customer is null)
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

		Order order = new()
		{
			Title = request.Title ?? string.Empty,
			Description = request.RawDescription ?? string.Empty,
			Category = request.Category,
			MinPrice = request.BudgetMin,
			MaxPrice = request.BudgetMax,
			Currency = request.Currency,
			Payment = request.BudgetType,
			Skills = request.Skills ?? new List<string>(),
			CreatedAt = DateTime.UtcNow,
			UpdatedAt = DateTime.UtcNow,
			PublishedAt = DateTime.UtcNow,
			Status = OrderStatus.Published,
			CustomerId = userId
		};

		_db.Orders.Add(order);
		await _db.SaveChangesAsync(ct);

		Order? createdOrder = await LoadOrderGraphAsync(order.Id, ct, asNoTracking: true);
		return Ok(ToDto(createdOrder!));
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

		Order? order = await LoadOrderGraphAsync(id, ct);

		if (order is null)
		{
			return NotFound(new
			{
				message = "Заказ не найден."
			});
		}

		if (order.CustomerId != userId)
		{
			return Forbid();
		}

		if (request.BudgetMin < 0 || request.BudgetMax < 0 || request.BudgetMin > request.BudgetMax)
		{
			return BadRequest(new
			{
				message = "Некорректные значения цен."
			});
		}

		order.Title = request.Title ?? string.Empty;
		order.Description = request.RawDescription ?? string.Empty;
		order.TechnicalSpecification = request.TechnicalSpecification ?? string.Empty;
		order.Category = request.Category;
		order.MinPrice = request.BudgetMin;
		order.MaxPrice = request.BudgetMax;
		order.Currency = request.Currency;
		order.Payment = request.BudgetType;
		order.Skills = request.Skills ?? new List<string>();

		OrderStatus oldStatus = order.Status;

		order.Status = request.Status;
		order.WorkflowStage = request.WorkflowStage;
		order.AiGenerated = request.AiGenerated;
		order.ReadinessScore = request.ReadinessScore;
		order.ClientApproved = request.Approvals.Client;
		order.FreelancerApproved = request.Approvals.Freelancer;
		order.UpdatedAt = DateTime.UtcNow;

		if (oldStatus != OrderStatus.Published && request.Status == OrderStatus.Published)
		{
			order.PublishedAt = DateTime.UtcNow;
		}

		if (request.CompanyName is not null)
		{
			order.Customer.CompanyName = request.CompanyName;
		}

		if (order.BriefSections is null || order.BriefSections.Id == 0)
		{
			order.BriefSections = new OrderBriefSections
			{
				OrderId = order.Id
			};

			_db.OrderBriefSections.Add(order.BriefSections);
		}

		order.BriefSections.Goal = request.BriefSections.Goal;
		order.BriefSections.Audience = request.BriefSections.Audience;
		order.BriefSections.Screens = request.BriefSections.Screens;
		order.BriefSections.Features = request.BriefSections.Features;
		order.BriefSections.Content = request.BriefSections.Content;
		order.BriefSections.Design = request.BriefSections.Design;
		order.BriefSections.Constraints = request.BriefSections.Constraints;
		order.BriefSections.OpenQuestions = request.BriefSections.OpenQuestions;

		_db.ClarificationQuestions.RemoveRange(order.ClarificationQuestions);
		_db.ScopeItems.RemoveRange(order.ScopeItems);
		_db.DoneCriteria.RemoveRange(order.DoneCriteria);
		_db.Risks.RemoveRange(order.Risks);

		order.ClarificationQuestions = request.ClarificationQuestions
			.Select(question => new ClarificationQuestion
			{
				OrderId = order.Id,
				Question = question.Question,
				Importance = question.Importance,
				Answer = question.Answer,
				Options = question.Options ?? new List<string>()
			})
			.ToList();

		order.ScopeItems = request.ScopeItems
			.Select(scopeItem => new ScopeItem
			{
				OrderId = order.Id,
				Title = scopeItem.Title,
				Description = scopeItem.Description,
				Bucket = scopeItem.Bucket
			})
			.ToList();

		order.DoneCriteria = request.DoneCriteria
			.Select(doneCriterion => new DoneCriterion
			{
				OrderId = order.Id,
				Text = doneCriterion.Text,
				Checked = doneCriterion.Checked
			})
			.ToList();

		order.Risks = request.Risks
			.Select(risk => new RiskItem
			{
				OrderId = order.Id,
				Title = risk.Title,
				Level = risk.Level,
				Impact = risk.Impact,
				Action = risk.Action,
				Resolved = risk.Resolved
			})
			.ToList();

		await _db.SaveChangesAsync(ct);
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

		Order? order = await LoadOrderGraphAsync(request.OrderId, ct);

		if (order is null)
		{
			return NotFound(new
			{
				message = "Заказ не найден."
			});
		}

		if (order.CustomerId == userId)
		{
			return Forbid();
		}

		if (order.Status != OrderStatus.Published)
		{
			return BadRequest(new
			{
				message = "Невозможно откликнуться на заказ, который не опубликован."
			});
		}

		if (order.FreelancerId is not null)
		{
			return BadRequest(new
			{
				message = "Невозможно откликнуться на заказ, который уже имеет исполнителя."
			});
		}

		bool alreadyExists = order.Proposals.Any(p => p.FreelancerId == userId && p.Status != ProposalStatus.withdrawn);

		if (alreadyExists)
		{
			return BadRequest(new
			{
				message = "Вы уже откликались на этот заказ."
			});
		}

		Proposal proposal = new()
		{
			OrderId = request.OrderId,
			FreelancerId = userId,
			Message = request.Message.Trim(),
			Price = request.Price,
			Currency = order.Currency,
			EstimatedDays = request.EstimatedDays,
			Status = ProposalStatus.pending,
			CreatedAt = DateTime.UtcNow
		};

		order.Proposals.Add(proposal);
		order.UpdatedAt = DateTime.UtcNow;

		await _db.SaveChangesAsync(ct);
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

		Proposal? proposal = await _db.Proposals
			.AsNoTracking()
			.FirstOrDefaultAsync(item => item.Id == proposalId, ct);

		if (proposal is null)
		{
			return NotFound(new
			{
				message = "Отклик не найден."
			});
		}

		Order? order = await LoadOrderGraphAsync(proposal.OrderId, ct);

		if (order is null)
		{
			return NotFound(new
			{
				message = "Заказ не найден."
			});
		}

		if (order.CustomerId != userId)
		{
			return Forbid();
		}

		if (order.FreelancerId is not null)
		{
			return BadRequest(new
			{
				message = "Исполнитель уже выбран."
			});
		}

		Proposal? selectedProposal = order.Proposals.FirstOrDefault(item => item.Id == proposalId);

		if (selectedProposal is null)
		{
			return NotFound(new
			{
				message = "Отклик не найден."
			});
		}

		order.FreelancerId = selectedProposal.FreelancerId;
		order.Freelancer = selectedProposal.Freelancer;
		order.ClientApproved = false;
		order.FreelancerApproved = false;
		order.WorkflowStage = WorkflowStage.review;
		order.UpdatedAt = DateTime.UtcNow;

		foreach (Proposal item in order.Proposals)
		{
			if (item.Id == selectedProposal.Id)
			{
				item.Status = ProposalStatus.accepted;
			}
			else if (item.Status != ProposalStatus.withdrawn)
			{
				item.Status = ProposalStatus.declined;
			}
		}

		await _db.SaveChangesAsync(ct);
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

		Proposal? proposal = await _db.Proposals
			.AsNoTracking()
			.FirstOrDefaultAsync(item => item.Id == proposalId, ct);

		if (proposal is null)
		{
			return NotFound(new
			{
				message = "Отклик не найден."
			});
		}

		Order? order = await LoadOrderGraphAsync(proposal.OrderId, ct);

		if (order is null)
		{
			return NotFound(new
			{
				message = "Заказ не найден."
			});
		}

		Proposal? ownProposal = order.Proposals.FirstOrDefault(item => item.Id == proposalId);

		if (ownProposal is null || ownProposal.FreelancerId != userId)
		{
			return Forbid();
		}

		if (ownProposal.Status != ProposalStatus.pending || order.FreelancerId is not null)
		{
			return BadRequest(new
			{
				message = "Этот отклик уже нельзя отозвать."
			});
		}

		ownProposal.Status = ProposalStatus.withdrawn;
		order.UpdatedAt = DateTime.UtcNow;

		await _db.SaveChangesAsync(ct);
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

		Order? order = await LoadOrderGraphAsync(orderId, ct);

		if (order is null)
		{
			return NotFound(new
			{
				message = "Заказ не найден."
			});
		}

		if (order.CustomerId != userId)
		{
			return Forbid();
		}

		if (order.FreelancerId is null)
		{
			return BadRequest(new
			{
				message = "Сначала выберите исполнителя."
			});
		}

		order.ClientApproved = request.Approved;
		ApplyApprovalState(order);

		await _db.SaveChangesAsync(ct);
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

		Order? order = await LoadOrderGraphAsync(orderId, ct);

		if (order is null)
		{
			return NotFound(new
			{
				message = "Заказ не найден."
			});
		}

		if (order.FreelancerId != userId)
		{
			return Forbid();
		}

		order.FreelancerApproved = request.Approved;
		ApplyApprovalState(order);

		await _db.SaveChangesAsync(ct);
		return Ok(ToDto(order));
	}

	private async Task<Order?> LoadOrderGraphAsync(
		int orderId,
		CancellationToken ct,
		bool asNoTracking = false)
	{
		IQueryable<Order> query = _db.Orders
			.AsSplitQuery()
			.Include(order => order.Customer)
			.Include(order => order.Freelancer)
			.Include(order => order.BriefSections)
			.Include(order => order.ClarificationQuestions)
			.Include(order => order.ScopeItems)
			.Include(order => order.DoneCriteria)
			.Include(order => order.Risks)
			.Include(order => order.Proposals)
				.ThenInclude(proposal => proposal.Freelancer);

		if (asNoTracking)
		{
			query = query.AsNoTracking();
		}

		return await query.FirstOrDefaultAsync(order => order.Id == orderId, ct);
	}

	private bool TryGetUserId(out int userId)
	{
		string? userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
		return int.TryParse(userIdValue, out userId);
	}

	private static void ApplyApprovalState(Order order)
	{
		if (order.ClientApproved && order.FreelancerApproved)
		{
			order.Status = OrderStatus.In_Progress;
			order.WorkflowStage = WorkflowStage.approved;
		}
		else
		{
			if (order.Status == OrderStatus.In_Progress)
			{
				order.Status = OrderStatus.Published;
			}

			order.WorkflowStage = WorkflowStage.review;
		}

		order.UpdatedAt = DateTime.UtcNow;
	}

	private static OrderListItemDto ToDto(Order order)
	{
		string description = order.Description ?? string.Empty;

		return new OrderListItemDto
		{
			Id = order.Id,
			HirerId = order.CustomerId,
			HirerName = order.Customer?.FullName ?? string.Empty,
			CompanyName = order.Customer?.CompanyName ?? string.Empty,
			SelectedFreelancerId = order.FreelancerId,
			SelectedFreelancerName = order.Freelancer?.FullName,
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
			ProposalsCount = order.Proposals?.Count ?? 0,
			Proposals = order.Proposals
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
			ClarificationQuestions = order.ClarificationQuestions
				.Select(question => new ClarificationQuestionDto
				{
					Id = question.Id,
					Question = question.Question,
					Importance = question.Importance,
					Answer = question.Answer,
					Options = question.Options ?? new List<string>()
				})
				.ToList(),
			ScopeItems = order.ScopeItems
				.Select(scopeItem => new ScopeItemDto
				{
					Id = scopeItem.Id,
					Title = scopeItem.Title,
					Description = scopeItem.Description,
					Bucket = scopeItem.Bucket
				})
				.ToList(),
			DoneCriteria = order.DoneCriteria
				.Select(doneCriterion => new DoneCriterionDto
				{
					Id = doneCriterion.Id,
					Text = doneCriterion.Text,
					Checked = doneCriterion.Checked
				})
				.ToList(),
			Risks = order.Risks
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
			}
		};
	}
}
