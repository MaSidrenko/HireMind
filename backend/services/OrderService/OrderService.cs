using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace backend;

public class OrderService : IOrderService
{
	private readonly AppDbContext _db;
	private readonly IEmailSender _emailSender;
	private readonly ITelegramNotificationService _telegramNotificationService;

	public OrderService(AppDbContext context, IEmailSender emailSender, ITelegramNotificationService telegramNotificationService)
	{
		_db = context;
		_emailSender = emailSender;
		_telegramNotificationService = telegramNotificationService;
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

		User selectedFreelancer = order.Freelancer ?? throw new UserNotFoundException(selectedProposal.FreelancerId);
		string selectedSubject = BuildOrderNotificationSubject(order.Title);
		string selectedMessage = BuildOrderNotificationMessage(
			order.Title,
			"Ваш отклик принят заказчиком.",
			BuildUserDetailsText(order.Customer)
		);

		try
		{
			await _emailSender.SendEmailAsync(
				selectedFreelancer.Email,
				selectedSubject,
				selectedMessage
			);
		} catch(Exception ex)
		{
			System.Console.WriteLine($"Failed to send email: {ex.Message}");
		}
		try
		{
			if(selectedFreelancer.IsTelegramConnected && selectedFreelancer.TelegramChatId != null)
			{
				await _telegramNotificationService.SendContactNotificationAsync(
					selectedFreelancer.TelegramChatId.Value,
					$"{selectedSubject}\n{selectedMessage}"
				);
			}
		} catch(Exception ex)
		{
			System.Console.WriteLine(ex.ToString());
		}

		foreach(Proposal item in order.Proposals)
		{
			if(item.Id == selectedProposal.Id || item.Status != ProposalStatus.declined || item.Freelancer is null)
				continue;

			try
			{
				string declinedSubject = BuildOrderNotificationSubject(order.Title);
				string declinedMessage = BuildOrderNotificationMessage(
					order.Title,
					"Заказчик выбрал другого исполнителя."
				);

				await _emailSender.SendEmailAsync(
					item.Freelancer.Email,
					declinedSubject,
					declinedMessage
				);
			} catch(Exception ex)
			{
				System.Console.WriteLine($"Failed to send email: {ex.Message}");
			}
			try
			{
				if(item.Freelancer.IsTelegramConnected && item.Freelancer.TelegramChatId != null)
				{
					string declinedSubject = BuildOrderNotificationSubject(order.Title);
					string declinedMessage = BuildOrderNotificationMessage(
						order.Title,
						"Заказчик выбрал другого исполнителя."
					);

					await _telegramNotificationService.SendContactNotificationAsync(
						item.Freelancer.TelegramChatId.Value,
						$"{declinedSubject}\n{declinedMessage}"
					);
				}
			} catch(Exception ex)
			{
				System.Console.WriteLine(ex.ToString());
			}
		}

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
			TechnicalSpecification = request.TechnicalSpecification ?? string.Empty,
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
			CustomerId = customer.Id,
			AiGenerated = request.AiGenerated,
			ReadinessScore = request.ReadinessScore,
			WorkflowStage = request.AiGenerated ? WorkflowStage.brief : WorkflowStage.raw,
		};
		if (HasAiBriefContent(request))
		{
			order.BriefSections = new OrderBriefSections
			{
				Goal = request.BriefSections.Goal,
				Audience = request.BriefSections.Audience,
				Screens = request.BriefSections.Screens,
				Features = request.BriefSections.Features,
				Content = request.BriefSections.Content,
				Design = request.BriefSections.Design,
				Constraints = request.BriefSections.Constraints,
				OpenQuestions = request.BriefSections.OpenQuestions
			};

			order.ClarificationQuestions = request.ClarificationQuestions
				.Select(q => new ClarificationQuestion
				{
					Question = q.Question,
					Importance = q.Importance,
					Answer = q.Answer,
					Options = q.Options ?? new List<string>()
				})
				.ToList();

			order.ScopeItems = request.ScopeItems
				.Select(s => new ScopeItem
				{
					Title = s.Title,
					Description = s.Description,
					Bucket = s.Bucket
				})
				.ToList();

			order.DoneCriteria = request.DoneCriteria
				.Select(dc => new DoneCriterion
				{
					Text = dc.Text,
					Checked = dc.Checked
				})
				.ToList();

			order.Risks = request.Risks
				.Select(r => new RiskItem
				{
					Title = r.Title,
					Level = r.Level,
					Impact = r.Impact,
					Action = r.Action,
					Resolved = r.Resolved
				})
				.ToList();
		}

		_db.Orders.Add(order);

		await _db.SaveChangesAsync(ct);

		Order? createdOrder = await LoadOrderGraphAsync(order.Id, ct);

		return createdOrder ?? throw new OrderNotFoundException(order.Id);
	}

	private static bool HasAiBriefContent(CreateOrderRequest request)
	{
		return request.AiGenerated
			|| !string.IsNullOrWhiteSpace(request.TechnicalSpecification)
			|| !string.IsNullOrWhiteSpace(request.BriefSections.Goal)
			|| !string.IsNullOrWhiteSpace(request.BriefSections.Audience)
			|| !string.IsNullOrWhiteSpace(request.BriefSections.Screens)
			|| !string.IsNullOrWhiteSpace(request.BriefSections.Features)
			|| !string.IsNullOrWhiteSpace(request.BriefSections.Content)
			|| !string.IsNullOrWhiteSpace(request.BriefSections.Design)
			|| !string.IsNullOrWhiteSpace(request.BriefSections.Constraints)
			|| !string.IsNullOrWhiteSpace(request.BriefSections.OpenQuestions)
			|| request.ClarificationQuestions.Count > 0
			|| request.ScopeItems.Count > 0
			|| request.DoneCriteria.Count > 0
			|| request.Risks.Count > 0;
	}

	public async Task<Order> GetByIdAsync(int id, CancellationToken ct)
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
				HirerRating = order.Customer.Rating,
				SelectedFreelancerId = order.FreelancerId,
				SelectedFreelancerName = order.Freelancer != null 
					? order.Freelancer.FullName 
					: null,
				SelectedFreelancerRating = order.Freelancer != null
					? order.Freelancer.Rating
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
						.Select(Proposal => new ProjectProposalDto
						{
							Id = Proposal.Id,
							ProjectId = Proposal.OrderId,
							FreelancerId = Proposal.FreelancerId,
							FreelancerName = Proposal.Freelancer != null
								? Proposal.Freelancer.FullName
								: string.Empty,
							Message = Proposal.Message,
							Price = Proposal.Price,
							Currency = Proposal.Currency,
							EstimatedDays = Proposal.EstimatedDays,
							Status = Proposal.Status,
							CreatedAt = Proposal.CreatedAt
						})
						.ToList(),
					PublishedAt = order.PublishedAt,
					CompletedAt = order.CompletedAt,
					UpdatedAt = order.UpdatedAt,
					AiGenerated = order.AiGenerated,
					ReadinessScore = order.ReadinessScore,
					ClientRatingByFreelancer = order.ClientRatingByFreelancer,
					FreelancerRatingByClient = order.FreelancerRatingByClient
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
				HirerRating = order.Customer.Rating,
				SelectedFreelancerId = order.FreelancerId,
				SelectedFreelancerName = order.Freelancer != null 
					? order.Freelancer.FullName 
					: null,
				SelectedFreelancerRating = order.Freelancer != null
					? order.Freelancer.Rating
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
						.Select(Proposal => new ProjectProposalDto
						{
							Id = Proposal.Id,
							ProjectId = Proposal.OrderId,
							FreelancerId = Proposal.FreelancerId,
							FreelancerName = Proposal.Freelancer != null
								? Proposal.Freelancer.FullName
								: string.Empty,
							Message = Proposal.Message,
							Price = Proposal.Price,
							Currency = Proposal.Currency,
							EstimatedDays = Proposal.EstimatedDays,
							Status = Proposal.Status,
							CreatedAt = Proposal.CreatedAt
						})
						.ToList(),
					PublishedAt = order.PublishedAt,
					CompletedAt = order.CompletedAt,
					UpdatedAt = order.UpdatedAt,
					AiGenerated = order.AiGenerated,
					ReadinessScore = order.ReadinessScore,
					ClientRatingByFreelancer = order.ClientRatingByFreelancer,
					FreelancerRatingByClient = order.FreelancerRatingByClient
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
		User freelancer = await _db.Users.Where(u => u.Id == userId).FirstOrDefaultAsync(ct)
			?? throw new UserNotFoundException(userId);
		string proposalSubject = BuildOrderNotificationSubject(order.Title);
		string proposalMessage = BuildOrderNotificationMessage(
			order.Title,
			"Поступил новый отклик от исполнителя.",
			BuildUserDetailsText(freelancer, includeSkills: true)
		);
		try
		{
			await _emailSender.SendEmailAsync(
				order.Customer.Email,
				proposalSubject,
				proposalMessage
			);
		} catch(Exception ex)
		{
			System.Console.WriteLine($"Failed to send email: {ex.Message}");
		}
		try
		{
			if(order.Customer.IsTelegramConnected && order.Customer.TelegramChatId != null)
			{
				await _telegramNotificationService.SendContactNotificationAsync(
					order.Customer.TelegramChatId.Value,
					$"{proposalSubject}\n{proposalMessage}"
				);
			}
		} catch(Exception ex)
		{
			System.Console.WriteLine(ex.ToString());
		}

		return order;
	}
	public async Task<Order> CompleteByFreelancer(int orderID, int userId, CancellationToken ct)
	{
		Order? order = await LoadOrderGraphAsync(orderID, ct);

		if(order is null)
			throw new OrderNotFoundException(orderID);

		if(order.FreelancerId is null || order.Freelancer is null)
			throw new FreelancerNotSelectedException();

		if(order.FreelancerId != userId)
			throw new ForbiddenProposalOperationException();

		if(HasCompletedState(order) || order.ClientDoneApproved)
			throw new OrderCompletionAlreadyConfirmedException();

		if(order.Status != OrderStatus.In_Progress)
			throw new OrderCompletionUnavailableException();

		if(order.FreelancerDoneApproved)
			throw new OrderCompletionAlreadyRequestedException();

		order.FreelancerDoneApproved = true;
		order.ClientDoneApproved = false;
		order.UpdatedAt = DateTime.UtcNow;
		
		await _db.SaveChangesAsync(ct);

		string completionRequestedSubject = BuildOrderNotificationSubject(order.Title);
		string completionRequestedText = BuildOrderNotificationMessage(
			order.Title,
			"Исполнитель отметил заказ как готовый. Ожидается подтверждение заказчика."
		);

		try
		{
			await _emailSender.SendEmailAsync(
				order.Customer.Email,
				completionRequestedSubject,
				completionRequestedText
			);
		}
		catch (Exception ex)
		{
			System.Console.WriteLine(ex.Message);
		}

		try
		{
			if (order.Customer.IsTelegramConnected && order.Customer.TelegramChatId != null)
			{
				await _telegramNotificationService.SendContactNotificationAsync(
					order.Customer.TelegramChatId.Value,
					$"{completionRequestedSubject}\n{completionRequestedText}"
				);
			}
		}
		catch (Exception ex)
		{
			System.Console.WriteLine(ex.Message);
		}

		return order;
	}

	public async Task<Order> AcceptCompletionByClient(int orderId, int userId, CancellationToken ct)
	{
		Order? order = await LoadOrderGraphAsync(orderId, ct);
		if(order is null)
			throw new OrderNotFoundException(orderId);

		if(order.FreelancerId is null || order.Freelancer is null)
			throw new FreelancerNotSelectedException();

		if(order.CustomerId != userId)
			throw new ForbiddenProposalOperationException();

		if(HasCompletedState(order) || order.ClientDoneApproved)
			throw new OrderCompletionAlreadyConfirmedException();

		if(order.Status != OrderStatus.In_Progress)
			throw new OrderCompletionUnavailableException();

		if(!order.FreelancerDoneApproved)
			throw new OrderCompletionNotRequestedException();

		order.ClientDoneApproved = true;
		order.Status = OrderStatus.Completed;
		order.CompletedAt = DateTime.UtcNow;
		order.UpdatedAt = DateTime.UtcNow;
		await _db.SaveChangesAsync(ct);
		await RecalculateFreelancerCompletedOrdersAsync(order.FreelancerId.Value, ct);
		await _db.SaveChangesAsync(ct);

		string completionAcceptedSubject = BuildOrderNotificationSubject(order.Title);
		string completionAcceptedText = BuildOrderNotificationMessage(
			order.Title,
			"Заказчик подтвердил готовность. Заказ завершён."
		);

		try
		{
			await _emailSender.SendEmailAsync(
				order.Customer.Email,
				completionAcceptedSubject,
				completionAcceptedText
			);
		}
		catch (Exception ex)
		{
			System.Console.WriteLine(ex.Message);
		}

		try
		{
			if (order.Customer.IsTelegramConnected && order.Customer.TelegramChatId != null)
			{
				await _telegramNotificationService.SendContactNotificationAsync(
					order.Customer.TelegramChatId.Value,
					$"{completionAcceptedSubject}\n{completionAcceptedText}"
				);
			}
		}
		catch (Exception ex)
		{
			System.Console.WriteLine(ex.Message);
		}

		try
		{
			await _emailSender.SendEmailAsync(
				order.Freelancer.Email,
				completionAcceptedSubject,
				completionAcceptedText
			);
		}
		catch (Exception ex)
		{
			System.Console.WriteLine(ex.Message);
		}

		try
		{
			if (order.Freelancer.IsTelegramConnected && order.Freelancer.TelegramChatId != null)
			{
				await _telegramNotificationService.SendContactNotificationAsync(
					order.Freelancer.TelegramChatId.Value,
					$"{completionAcceptedSubject}\n{completionAcceptedText}"
				);
			}
		}
		catch (Exception ex)
		{
			System.Console.WriteLine(ex.Message);
		}

		return order;
	}
	public async Task<Order> RejectCompletionByClient(int orderId, int userId, CancellationToken ct)
	{
		Order? order = await LoadOrderGraphAsync(orderId, ct);

		if(order is null)
			throw new OrderNotFoundException(orderId);

		if(order.FreelancerId is null || order.Freelancer is null)
			throw new FreelancerNotSelectedException();

		if(order.CustomerId != userId)
			throw new ForbiddenProposalOperationException();

		if(HasCompletedState(order) || order.ClientDoneApproved)
			throw new OrderCompletionAlreadyConfirmedException();

		if(order.Status != OrderStatus.In_Progress)
			throw new OrderCompletionUnavailableException();

		if(!order.FreelancerDoneApproved)
			throw new OrderCompletionNotRequestedException();

		order.FreelancerDoneApproved = false;
		order.ClientDoneApproved = false;
		order.Status = OrderStatus.In_Progress;
		order.CompletedAt = null;
		order.UpdatedAt = DateTime.UtcNow;

		await _db.SaveChangesAsync(ct);

		string completionRejectedSubject = BuildOrderNotificationSubject(order.Title);
		string completionRejectedText = BuildOrderNotificationMessage(
			order.Title,
			"Заказчик отклонил завершение. Проект возвращён в работу."
		);

		try
		{
			await _emailSender.SendEmailAsync(
				order.Freelancer.Email,
				completionRejectedSubject,
				completionRejectedText
			);
		}
		catch (Exception ex)
		{
			System.Console.WriteLine(ex.Message);
		}

		try
		{
			if (order.Freelancer.IsTelegramConnected && order.Freelancer.TelegramChatId != null)
			{
				await _telegramNotificationService.SendContactNotificationAsync(
					order.Freelancer.TelegramChatId.Value,
					$"{completionRejectedSubject}\n{completionRejectedText}"
				);
			}
		}
		catch (Exception ex)
		{
			System.Console.WriteLine(ex.Message);
		}

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

		OrderStatus oldStatus = order.Status;
		order.ClientApproved = request.Approved;

		ApplyApprovalState(order);

		await _db.SaveChangesAsync(ct);

		bool movedToWorkNow = oldStatus != OrderStatus.In_Progress
			&& order.Status == OrderStatus.In_Progress;
		string emailSubject = BuildOrderNotificationSubject(order.Title);
		string notificationText = request.Approved
			? BuildOrderNotificationMessage(order.Title, "Заказчик подтвердил согласование.")
			: BuildOrderNotificationMessage(order.Title, "Заказчик отменил согласование.");

		if (!movedToWorkNow && order.Freelancer is not null)
		{
			try
			{
				await _emailSender.SendEmailAsync(
					order.Freelancer.Email,
					emailSubject,
					notificationText
				);
			} catch (Exception ex)
			{
				System.Console.WriteLine(ex.Message);
			}

			try
			{
				if(order.Freelancer.IsTelegramConnected && order.Freelancer.TelegramChatId != null)
				{
					await _telegramNotificationService.SendContactNotificationAsync(
						order.Freelancer.TelegramChatId.Value,
						$"{emailSubject}\n{notificationText}"

					);
				}
			}catch(Exception ex)
			{
				System.Console.WriteLine(ex.Message);
			}
		}

		if(movedToWorkNow && order.Freelancer is not null)
		{
			string startSubject = BuildOrderNotificationSubject(order.Title);
			string startText = BuildOrderNotificationMessage(
				order.Title,
				"Проект переведён в работу. Обе стороны подтвердили согласование."
			);

			try
			{
				await _emailSender.SendEmailAsync(
					order.Customer.Email,
					startSubject,
					startText
				);
			} catch (Exception ex)
			{
				System.Console.WriteLine(ex.Message);
			}

			try
			{
				if(order.Customer.IsTelegramConnected && order.Customer.TelegramChatId != null)
				{
					await _telegramNotificationService.SendContactNotificationAsync(
						order.Customer.TelegramChatId.Value,
						$"{startSubject}\n{startText}"
					);
				}
			}catch(Exception ex)
			{
				System.Console.WriteLine(ex.Message);
			}

			try
			{
				await _emailSender.SendEmailAsync(
					order.Freelancer.Email,
					startSubject,
					startText
				);
			} catch (Exception ex)
			{
				System.Console.WriteLine(ex.Message);
			}

			try
			{
				if(order.Freelancer.IsTelegramConnected && order.Freelancer.TelegramChatId != null)
				{
					await _telegramNotificationService.SendContactNotificationAsync(
						order.Freelancer.TelegramChatId.Value,
						$"{startSubject}\n{startText}"
					);
				}
			}catch(Exception ex)
			{
				System.Console.WriteLine(ex.Message);
			}
		}

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

		OrderStatus oldStatus = order.Status;
		order.FreelancerApproved = request.Approved;

		ApplyApprovalState(order);

		await _db.SaveChangesAsync(ct);

		bool movedToWorkNow = oldStatus != OrderStatus.In_Progress
			&& order.Status == OrderStatus.In_Progress;
		string emailSubject = BuildOrderNotificationSubject(order.Title);
		if(order.Freelancer is not null && !movedToWorkNow)
		{
			string notificationText = request.Approved
				? BuildOrderNotificationMessage(order.Title, "Исполнитель подтвердил согласование.")
				: BuildOrderNotificationMessage(order.Title, "Исполнитель отменил согласование.");

			try
			{
				await _emailSender.SendEmailAsync(
					order.Customer.Email,
					emailSubject,
					notificationText
				);
			} catch (Exception ex)
			{
				System.Console.WriteLine(ex.Message);
			}

			try
			{
				if(order.Customer.IsTelegramConnected && order.Customer.TelegramChatId != null)
				{
					await _telegramNotificationService.SendContactNotificationAsync(
						order.Customer.TelegramChatId.Value,
						$"{emailSubject}\n{notificationText}"

					);
				}
			}catch(Exception ex)
			{
				System.Console.WriteLine(ex.Message);
			}
		}

		if(movedToWorkNow && order.Freelancer is not null)
		{
			string startSubject = BuildOrderNotificationSubject(order.Title);
			string startText = BuildOrderNotificationMessage(
				order.Title,
				"Проект переведён в работу. Обе стороны подтвердили согласование."
			);

			try
			{
				await _emailSender.SendEmailAsync(
					order.Customer.Email,
					startSubject,
					startText
				);
			} catch (Exception ex)
			{
				System.Console.WriteLine(ex.Message);
			}

			try
			{
				if(order.Customer.IsTelegramConnected && order.Customer.TelegramChatId != null)
				{
					await _telegramNotificationService.SendContactNotificationAsync(
						order.Customer.TelegramChatId.Value,
						$"{startSubject}\n{startText}"
					);
				}
			}catch(Exception ex)
			{
				System.Console.WriteLine(ex.Message);
			}

			try
			{
				await _emailSender.SendEmailAsync(
					order.Freelancer.Email,
					startSubject,
					startText
				);
			} catch (Exception ex)
			{
				System.Console.WriteLine(ex.Message);
			}

			try
			{
				if(order.Freelancer.IsTelegramConnected && order.Freelancer.TelegramChatId != null)
				{
					await _telegramNotificationService.SendContactNotificationAsync(
						order.Freelancer.TelegramChatId.Value,
						$"{startSubject}\n{startText}"
					);
				}
			}catch(Exception ex)
			{
				System.Console.WriteLine(ex.Message);
			}
		}


		return order;
	}

	public async Task<Order> UpdateOrderAsync(int orderId, int userId, UpdateOrderRequest request, CancellationToken ct)
	{
		if(request.Status == OrderStatus.In_Progress || request.Status == OrderStatus.Completed
				|| request.Status == OrderStatus.Cancelled)
		{
			throw new OrderStatusUpdateUnavailableException();
		}
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
		bool wasCompletedBeforeUpdate = HasCompletedState(order);
		// bool isLeavingCompletedState = wasCompletedBeforeUpdate
		// 	&& request.Status != OrderStatus.Completed
		// 	&& request.Status != OrderStatus.Archived;
		// bool shouldClearClientRating = isLeavingCompletedState
		// 	&& order.ClientRatingByFreelancer.HasValue;
		// bool shouldClearFreelancerRating = isLeavingCompletedState
		// 	&& order.FreelancerRatingByClient.HasValue;
		// bool shouldRecalculateCompletedOrders = order.FreelancerId.HasValue
		// 	&& (wasCompletedBeforeUpdate || request.Status == OrderStatus.Completed);

		order.Status = request.Status;
		order.WorkflowStage = request.WorkflowStage;
		order.AiGenerated = request.AiGenerated;
		order.ReadinessScore = request.ReadinessScore;
		// order.ClientApproved = request.Approvals.Client;
		// order.FreelancerApproved = request.Approvals.Freelancer;
		order.UpdatedAt = DateTime.UtcNow;

		if(oldStatus != OrderStatus.Published && request.Status == OrderStatus.Published)
			order.PublishedAt = DateTime.UtcNow;

		// ApplyCompletedState(order, wasCompletedBeforeUpdate, request.Status);

		// if (isLeavingCompletedState)
		// {
		// 	order.CompletedAt = null;
		// 	order.ClientRatingByFreelancer = null;
		// 	order.FreelancerRatingByClient = null;
		// }
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

		// if (shouldRecalculateCompletedOrders && order.FreelancerId.HasValue)
		// {
		// 	await RecalculateFreelancerCompletedOrdersAsync(order.FreelancerId.Value, ct);
		// }

		// if (shouldClearClientRating)
		// {
		// 	await RecalculateClientRatingAsync(order.CustomerId, ct);
		// }

		// if (shouldClearFreelancerRating && order.FreelancerId.HasValue)
		// {
		// 	await RecalculateFreelancerRatingAsync(order.FreelancerId.Value, ct);
		// }

		// if (shouldClearClientRating || shouldClearFreelancerRating)
		// {
		// 	await _db.SaveChangesAsync(ct);
		// }

		if(oldStatus != order.Status && order.FreelancerId.HasValue && order.Freelancer is not null)
		{
			string? emailSubject = null;
			string? notificationText = null;

			if(order.Status == OrderStatus.Paused)
			{
				emailSubject = BuildOrderNotificationSubject(order.Title);
				notificationText = BuildOrderNotificationMessage(order.Title, "Заказчик поставил проект на паузу.");
			}
			// else if(order.Status == OrderStatus.Completed)
			// {
			// 	emailSubject = BuildOrderNotificationSubject(order.Title);
			// 	notificationText = BuildOrderNotificationMessage(order.Title, "Заказчик отметил проект как завершённый.");
			// }
			// else if(order.Status == OrderStatus.Cancelled)
			// {
			// 	emailSubject = BuildOrderNotificationSubject(order.Title);
			// 	notificationText = BuildOrderNotificationMessage(order.Title, "Заказчик отменил проект.");
			// }
			else if(order.Status == OrderStatus.Archived)
			{
				emailSubject = BuildOrderNotificationSubject(order.Title);
				notificationText = BuildOrderNotificationMessage(order.Title, "Заказчик отправил проект в архив.");
			}
			else if(order.Status == OrderStatus.Published && oldStatus == OrderStatus.Paused)
			{
				emailSubject = BuildOrderNotificationSubject(order.Title);
				notificationText = BuildOrderNotificationMessage(order.Title, "Заказчик снял проект с паузы.");
			}
			else if(order.Status == OrderStatus.Published && oldStatus == OrderStatus.Archived)
			{
				emailSubject = BuildOrderNotificationSubject(order.Title);
				notificationText = BuildOrderNotificationMessage(order.Title, "Заказчик вернул проект из архива.");
			}

			if(emailSubject is not null && notificationText is not null)
			{
				try
				{
					await _emailSender.SendEmailAsync(
						order.Freelancer.Email,
						emailSubject,
						notificationText
					);
				} catch (Exception ex)
				{
					System.Console.WriteLine(ex.Message);
				}

				try
				{
					if(order.Freelancer.IsTelegramConnected && order.Freelancer.TelegramChatId != null)
					{
						await _telegramNotificationService.SendContactNotificationAsync(
							order.Freelancer.TelegramChatId.Value,
							$"{emailSubject}\n{notificationText}"
						);
					}
				}catch(Exception ex)
				{
					System.Console.WriteLine(ex.Message);
				}
			}
		}

		return order;
	}

	public async Task<Order> UpdateClarificationQuestionsAsync(
		int orderId,
		int userId,
		UpdateClarificationQuestionsRequest request,
		CancellationToken ct)
	{
		Order? order = await LoadOrderGraphAsync(orderId, ct);

		if (order is null)
			throw new OrderNotFoundException(orderId);

		if (order.FreelancerId != userId)
			throw new OrderAccessDeniedException(orderId);

		_db.ClarificationQuestions.RemoveRange(order.ClarificationQuestions);

		order.ClarificationQuestions = request.ClarificationQuestions
			.Where(question => !string.IsNullOrWhiteSpace(question.Question))
			.Select(question => new ClarificationQuestion
			{
				OrderId = order.Id,
				Question = question.Question.Trim(),
				Importance = question.Importance,
				Answer = question.Answer,
				Options = question.Options
					.Where(option => !string.IsNullOrWhiteSpace(option))
					.Select(option => option.Trim())
					.ToList()
			})
			.ToList();

		order.WorkflowStage = WorkflowStage.clarification;
		order.UpdatedAt = DateTime.UtcNow;

		await _db.SaveChangesAsync(ct);

		return await LoadOrderGraphAsync(orderId, ct)
			?? throw new OrderNotFoundException(orderId);
	}

	public async Task<Order> RateOrderAsync(int orderId, int userId, UpdateOrderRatingRequest request, CancellationToken ct)
	{
		Order? order = await LoadOrderGraphAsync(orderId, ct);

		if (order is null)
		{
			throw new OrderNotFoundException(orderId);
		}

		if (order.FreelancerId is null)
		{
			throw new FreelancerNotSelectedException();
		}

		if (!HasCompletedState(order))
		{
			throw new OrderRatingUnavailableException();
		}

		if (order.CompletedAt is null)
		{
			order.CompletedAt = DateTime.UtcNow;
		}
		
		bool isHirer = false;
		if (order.CustomerId == userId)
		{
			isHirer = true;
			order.FreelancerRatingByClient = request.Score;
		}
		else if (order.FreelancerId == userId)
		{
			order.ClientRatingByFreelancer = request.Score;
		}
		else
		{
			throw new ForbiddenProposalOperationException();
		}

		order.UpdatedAt = DateTime.UtcNow;

		await _db.SaveChangesAsync(ct);
		await RecalculateFreelancerCompletedOrdersAsync(order.FreelancerId.Value, ct);

		if (order.CustomerId == userId)
		{
			await RecalculateFreelancerRatingAsync(order.FreelancerId.Value, ct);
		}
		else
		{
			await RecalculateClientRatingAsync(order.CustomerId, ct);
		}

		await _db.SaveChangesAsync(ct);
		string ratingSubject = BuildOrderNotificationSubject(order.Title);
		if(isHirer)
		{		
			try
			{
				await _emailSender.SendEmailAsync(
					order.Freelancer.Email,
					ratingSubject,
					BuildOrderNotificationMessage(
						order.Title,
						$"Заказчик поставил вам оценку: {order.FreelancerRatingByClient}."
					)
				);
			} catch (Exception ex)
			{
				System.Console.WriteLine(ex.Message);
			}

			try
			{
				if(order.Freelancer.IsTelegramConnected && order.Freelancer.TelegramChatId != null)
				{
					await _telegramNotificationService.SendContactNotificationAsync(
						order.Freelancer.TelegramChatId.Value,
						$"{ratingSubject}\n" +
						BuildOrderNotificationMessage(
							order.Title,
							$"Заказчик поставил вам оценку: {order.FreelancerRatingByClient}."
						)

					);
				}
			}catch(Exception ex)
			{
				System.Console.WriteLine(ex.Message);
			}
		} else
		{
			try
			{
					await _emailSender.SendEmailAsync(
						order.Customer.Email,
						ratingSubject,
						BuildOrderNotificationMessage(
							order.Title,
							$"Исполнитель поставил вам оценку: {order.ClientRatingByFreelancer}."
						)
					);
			} catch (Exception ex)
			{
				System.Console.WriteLine(ex.Message);
			}

			try
			{
				if(order.Customer.IsTelegramConnected && order.Customer.TelegramChatId != null)
				{
					await _telegramNotificationService.SendContactNotificationAsync(
						order.Customer.TelegramChatId.Value,
						$"{ratingSubject}\n" +
						BuildOrderNotificationMessage(
							order.Title,
							$"Исполнитель поставил вам оценку: {order.ClientRatingByFreelancer}."
						)

					);
				}
			}catch(Exception ex)
			{
				System.Console.WriteLine(ex.Message);
			}
		}

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

		if (ownProposal.Status == ProposalStatus.accepted)
			throw new ProposalWithdrawalUnavailableException();

		ownProposal.Status = ProposalStatus.withdrawn;
		order.UpdatedAt = DateTime.UtcNow;

		await _db.SaveChangesAsync(ct);
		User proposalFreelancer = ownProposal.Freelancer ?? throw new UserNotFoundException(ownProposal.FreelancerId);
		string withdrawSubject = BuildOrderNotificationSubject(order.Title);
		string withdrawMessage = BuildOrderNotificationMessage(
			order.Title,
			"Исполнитель отозвал свой отклик.",
			BuildUserDetailsText(proposalFreelancer, includeSkills: true)
		);
		
		try
			{
				await _emailSender.SendEmailAsync(
					order.Customer.Email,
					withdrawSubject,
					withdrawMessage
				);
			} catch (Exception ex)
			{
				System.Console.WriteLine(ex.Message);
			}

			try
			{
				if(order.Customer.IsTelegramConnected && order.Customer.TelegramChatId != null)
				{
					await _telegramNotificationService.SendContactNotificationAsync(
						order.Customer.TelegramChatId.Value,
						$"{withdrawSubject}\n{withdrawMessage}"

					);
				}
			}catch(Exception ex)
			{
				System.Console.WriteLine(ex.Message);
			}

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

	private static bool HasCompletedState(Order order)
	{
		return order.Status == OrderStatus.Completed || order.CompletedAt is not null;
	}

	private static string BuildOrderNotificationSubject(string orderTitle)
	{
		return $"Уведомление по проекту: {orderTitle}";
	}

	private static string BuildOrderNotificationMessage(string orderTitle, string eventText, string? details = null)
	{
		string message = $"Проект: {orderTitle}\nСобытие: {eventText}";

		if (!string.IsNullOrWhiteSpace(details))
		{
			message += $"\n{details}";
		}

		return message;
	}

	private static string BuildUserDetailsText(User user, bool includeSkills = false)
	{
		string text = $"Имя: {user.FullName}\nEmail: {user.Email}";

		if (!string.IsNullOrWhiteSpace(user.Contacts?.Telegram))
		{
			text += $"\nTelegram: {user.Contacts.Telegram}";
		}

		if (!string.IsNullOrWhiteSpace(user.Contacts?.Phone))
		{
			text += $"\nТелефон: {user.Contacts.Phone}";
		}

		if (includeSkills && user.Skills.Count > 0)
		{
			text += $"\nНавыки: {string.Join(", ", user.Skills)}";
		}

		return text;
	}

	private static void ApplyCompletedState(Order order, bool wasCompletedBeforeUpdate, OrderStatus newStatus)
	{
		if (newStatus == OrderStatus.Completed && order.CompletedAt is null)
		{
			order.CompletedAt = DateTime.UtcNow;
		}
	}

	private async Task RecalculateClientRatingAsync(int clientId, CancellationToken ct)
	{
		User? client = await _db.Users.FirstOrDefaultAsync(user => user.Id == clientId, ct);

		if (client is null)
		{
			throw new UserNotFoundException(clientId);
		}

		double[] ratings = await _db.Orders
			.AsNoTracking()
			.Where(order => order.CustomerId == clientId && order.ClientRatingByFreelancer.HasValue)
			.Select(order => (double)order.ClientRatingByFreelancer!.Value)
			.ToArrayAsync(ct);

		client.Rating = ratings.Length == 0 ? 0 : Math.Round(ratings.Average(), 2);
	}

	private async Task RecalculateFreelancerRatingAsync(int freelancerId, CancellationToken ct)
	{
		User? freelancer = await _db.Users.FirstOrDefaultAsync(user => user.Id == freelancerId, ct);

		if (freelancer is null)
		{
			throw new UserNotFoundException(freelancerId);
		}

		double[] ratings = await _db.Orders
			.AsNoTracking()
			.Where(order => order.FreelancerId == freelancerId && order.FreelancerRatingByClient.HasValue)
			.Select(order => (double)order.FreelancerRatingByClient!.Value)
			.ToArrayAsync(ct);

		freelancer.Rating = ratings.Length == 0 ? 0 : Math.Round(ratings.Average(), 2);
	}

	private async Task RecalculateFreelancerCompletedOrdersAsync(int freelancerId, CancellationToken ct)
	{
		User? freelancer = await _db.Users.FirstOrDefaultAsync(user => user.Id == freelancerId, ct);

		if (freelancer is null)
		{
			throw new UserNotFoundException(freelancerId);
		}

		int completedOrders = await _db.Orders
			.AsNoTracking()
			.CountAsync(
				order => order.FreelancerId == freelancerId
					&& (order.Status == OrderStatus.Completed || order.CompletedAt.HasValue),
				ct);

		freelancer.CompletedOrders = completedOrders;
	}
}
