using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace backend;

public class OrderService : IOrderService
{
	private readonly AppDbContext _db;

	public OrderService(AppDbContext context)
	{
		_db = context;
	}

	public async Task<Order> AcceptProposalAsync(int proposalId,int userId, CancellationToken ct)
	{
		Proposal? proposal = await _db.Proposals
				.AsNoTracking()
				.FirstOrDefaultAsync(p => p.Id == proposalId, ct);

		if(proposal is null)
		{
			throw new ProposalNotFoundException(proposalId);
		}

		Order? order = await LoadOrderGraphAsync(proposal.OrderId, ct);

		if (order is null)
			throw new OrderNotFoundException(proposal.OrderId);

		if (order.CustomerId != userId)
			throw new ForbiddenProposalOperationException();

		if (order.FreelancerId is not null)
			throw new FreelancerAlreadySelectedException();

		Proposal? selectedProposal = order.Proposals.FirstOrDefault(p => p.Id == proposalId);

		if(selectedProposal is null)
		{
			throw new ProposalNotFoundException(proposalId);
		}

		order.FreelancerId = selectedProposal.FreelancerId;
		order.Freelancer = selectedProposal.Freelancer;
		order.ClientApproved = false;
		order.FreelancerApproved = false;
		order.WorkflowStage = WorkflowStage.review;
		order.UpdatedAt = DateTime.UtcNow;

		foreach(Proposal item in order.Proposals)
		{
			if(item.Id == selectedProposal.Id) {
				item.Status = ProposalStatus.accepted;
			}
			else if(item.Status != ProposalStatus.withdrawn)
			{
				item.Status = ProposalStatus.declined;
			}
		}

		await _db.SaveChangesAsync(ct);

		return order;

	}

	public async Task<Order> CreateOrderAsync(CreateOrderRequest request, int userID, CancellationToken ct)
	{
		User? customer = await _db.Users.FindAsync(new object[] { userID }, ct);

		if(customer is null)
		{
			throw new UserNotFoundException(userID);
		}


		Order order = new Order
		{
			Title = request.Title ?? string.Empty,
			Description = request.RawDescription ?? string.Empty,
			Category = request.Category,
			MinPrice = request.BudgetMin,
			MaxPrice = request.BudgetMax,
			Currency = request.Currency,
			Skills = request.Skills ?? new List<string>(),
			CreatedAt = DateTime.UtcNow,
			UpdatedAt = DateTime.UtcNow,
			PublishedAt = DateTime.UtcNow,
			Status = OrderStatus.Published,
			CustomerId = customer.Id,
		};

		_db.Orders.Add(order);

		await _db.SaveChangesAsync(ct);

		Order? createdOrder = await LoadOrderGraphAsync(order.Id, ct);

		return createdOrder;
	}

	public async Task<Order?> GetByIdAsync(int id, CancellationToken ct)
	{
		Order? order = await LoadOrderGraphAsync(id, ct, asNoTracking: true);

		if (order is null)
		{
			throw new OrderNotFoundException(id);
		}

		return order;
	}

	public async Task<List<OrderListItemDto>> GetListAsync(CancellationToken ct)
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
				Skills = order.Skills,
				Status = order.Status,
				WorkflowStage = order.WorkflowStage,
				ProposalsCount = order.Proposals.Count,
				Proposals = order.Proposals
						.OrderByDescending(proposal => proposal.CreatedAt)
						.Select(Proposal => new ProjectProposalDto
						{
							Id = Proposal.Id,
							ProjectId = Proposal.OrderId,
							FreelancerId = Proposal.FreelancerId,
							FreelancerName = Proposal.Freelancer.FullName,
							Message = Proposal.Message,
							Price = Proposal.Price,
							Currency = Proposal.Currency,
							EstimatedDays = Proposal.EstimatedDays,
							Status = Proposal.Status,
							CreatedAt = Proposal.CreatedAt
						})
						.ToList(),
					PublishedAt = order.PublishedAt,
					UpdatedAt = order.UpdatedAt,
					AiGenerated = order.AiGenerated,
					ReadinessScore = order.ReadinessScore
			})
			.Where(o => o.Status != OrderStatus.Completed)
			.ToListAsync(ct);

			return orders;
	}

	public async Task<List<OrderListItemDto>> GetAccteptedProjectListAsync(CancellationToken ct)
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
				Skills = order.Skills,
				Status = order.Status,
				WorkflowStage = order.WorkflowStage,
				ProposalsCount = order.Proposals.Count,
				Proposals = order.Proposals
						.OrderByDescending(proposal => proposal.CreatedAt)
						.Select(Proposal => new ProjectProposalDto
						{
							Id = Proposal.Id,
							ProjectId = Proposal.OrderId,
							FreelancerId = Proposal.FreelancerId,
							FreelancerName = Proposal.Freelancer.FullName,
							Message = Proposal.Message,
							Price = Proposal.Price,
							Currency = Proposal.Currency,
							EstimatedDays = Proposal.EstimatedDays,
							Status = Proposal.Status,
							CreatedAt = Proposal.CreatedAt
						})
						.ToList(),
					PublishedAt = order.PublishedAt,
					UpdatedAt = order.UpdatedAt,
					AiGenerated = order.AiGenerated,
					ReadinessScore = order.ReadinessScore
			})
			.ToListAsync(ct);

			return orders;
	}

	public async Task<Order?> LoadOrderGraphAsync(int orderId, CancellationToken ct, bool asNoTracking = false)
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

	public async Task<Order> RespondToOrderAsync(int userId, CreateProposalRequest request, CancellationToken ct)
	{
		Order? order = await LoadOrderGraphAsync(request.OrderId, ct);

		if(order is null)
			throw new OrderNotFoundException(request.OrderId);

		if(order.CustomerId == userId)
			throw new ForbiddenProposalOperationException();

		if(order.Status != OrderStatus.Published)
			throw new OrderNotPublishedException();

		if(order.FreelancerId is not null)
			throw new FreelancerAlreadySelectedException();

		bool alreadyExists = order.Proposals.Any(p => p.FreelancerId == userId && p.Status != ProposalStatus.withdrawn);

		if (alreadyExists)
			throw new ProposalAlreadyExistsException(request.OrderId, userId);

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
		return order;

	}

	public async Task<Order> UpdateClientApproval(
		int orderId,
		int userId,
		UpdateApprovalRequest request,
		CancellationToken ct)
	{
		Order? order = await LoadOrderGraphAsync(orderId, ct);

		if (order is null)
		{
			throw new OrderNotFoundException(orderId);
		}

		if (order.CustomerId != userId)
		{
			throw new ForbiddenProposalOperationException();
		}

		if (order.FreelancerId is null)
		{
			throw new FreelancerNotSelectedException();
		}

		order.ClientApproved = request.Approved;

		ApplyApprovalState(order);

		await _db.SaveChangesAsync(ct);

		return order;
	}
	public async Task<Order> UpdateFreelancerApprovalAsync(int orderId, int userId, UpdateApprovalRequest request, CancellationToken ct)
	{
		Order? order = await LoadOrderGraphAsync(orderId, ct);

		if (order is null)
		{
			throw new OrderNotFoundException(orderId);
		}

		if (order.FreelancerId != userId)
		{
			throw new ForbiddenProposalOperationException();
		}

		if (order.FreelancerId is null)
		{
			throw new FreelancerNotSelectedException();
		}

		order.FreelancerApproved = request.Approved;

		ApplyApprovalState(order);

		await _db.SaveChangesAsync(ct);

		return order;
	}

	public async Task<Order> UpdateOrderAsync(int orderId, int userId, UpdateOrderRequest request, CancellationToken ct)
	{
		Order? order = await LoadOrderGraphAsync(orderId, ct);

		if(order is null)
			throw new OrderNotFoundException(orderId);

		if(order.CustomerId != userId)
			throw new ForbiddenProposalOperationException();


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

		if(oldStatus != OrderStatus.Published && request.Status == OrderStatus.Published)
			order.PublishedAt = DateTime.UtcNow;


		if(request.CompanyName is not null)		
			order.Customer.CompanyName = request.CompanyName;

		if(order.BriefSections is null || order.BriefSections.Id == 0)
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
			.Select(q => new ClarificationQuestion
			{
				OrderId = order.Id,
				Question = q.Question,
				Importance = q.Importance,
				Answer = q.Answer,
				Options = q.Options ?? new List<string>()
			}).ToList();

		order.ScopeItems = request.ScopeItems
			.Select(s => new ScopeItem
			{
				OrderId = order.Id,
				Title = s.Title,
				Description = s.Description,
				Bucket = s.Bucket
			}).ToList();

		order.DoneCriteria = request.DoneCriteria
			.Select(dc => new DoneCriterion
			{
				OrderId = order.Id,
				Text = dc.Text,
				Checked = dc.Checked
			}).ToList();

		order.Risks = request.Risks
			.Select(r => new RiskItem
			{
				OrderId = order.Id,
				Title = r.Title,
				Level = r.Level,
				Impact = r.Impact,
				Action = r.Action,
				Resolved = r.Resolved
			}).ToList();

		await _db.SaveChangesAsync(ct);

		return order;
	}

	public async Task<Order> WithdrawProposalAsync(int proposalId, int userId, CancellationToken ct)
	{
		Proposal? proposal = await _db.Proposals
					.AsNoTracking()
					.FirstOrDefaultAsync(p => p.Id == proposalId, ct);

		if(proposal is null)
			throw new ProposalNotFoundException(proposalId);

		Order? order = await LoadOrderGraphAsync(proposal.OrderId, ct);

		if(order is null)
			throw new OrderNotFoundException(proposal.OrderId);

		Proposal? ownProposal = order.Proposals.FirstOrDefault(item => item.Id == proposalId);

		if(ownProposal is null)
			throw new ProposalNotFoundException(proposalId);

		if(ownProposal.FreelancerId != userId)
			throw new ForbiddenProposalOperationException();

		ownProposal.Status = ProposalStatus.withdrawn;
		order.UpdatedAt = DateTime.UtcNow;

		await _db.SaveChangesAsync(ct);
		return order;
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
}
