using Microsoft.EntityFrameworkCore;

namespace backend;

public class FreelancerService : IFreelancerService
{
	private readonly AppDbContext _dbContext;
	private readonly IEmailSender _emailSender;
	private readonly ITelegramNotificationService _telegramNotificationService;

	public FreelancerService(AppDbContext db, IEmailSender emailSender, ITelegramNotificationService telegramNotificationService)
	{
		_dbContext = db;
		_emailSender = emailSender;
		_telegramNotificationService = telegramNotificationService;
	}

	public async Task<ContactRequestDto> CreateContactRequestAsync(int hirerId, int freelancerId, string message, CancellationToken ct = default)
	{
		User? Hirer = await _dbContext.Users.FindAsync(hirerId);

		if(Hirer is null || Hirer.Role != Role.Client)
		{
			throw new UserNotFoundException("Клиент не найден.", "user_not_found");
		}

		User? Freelancer = await _dbContext.Users.FindAsync(freelancerId);
		if(Freelancer is null || Freelancer.Role != Role.Freelancer)
		{
			throw new UserNotFoundException("Фрилансер не найден.", "user_not_found");
		}
		bool contactExists = await _dbContext.Contacts
						.AnyAsync(
							contact => 
									contact.ClientId == hirerId 
									&& contact.FreelancerId == freelancerId
									&& contact.Status == ContactStatus.sent , ct);
		if(contactExists) 
		{
			throw new ContactRequestAlreadyExistsException();
		}

		string body = message.Trim() + 
					$"\nContact the client at: {Hirer.Email}" 
					+ (!string.IsNullOrWhiteSpace(Hirer.Contacts?.Telegram) ? $"\nor via Telegram: {Hirer.Contacts.Telegram}" : string.Empty) 
					+ (!string.IsNullOrWhiteSpace(Hirer.Contacts?.Phone) ? $"\nor via Phone: {Hirer.Contacts.Phone}" : string.Empty);
	
		Contact contact = new Contact
		{
			FreelancerId = freelancerId,
			ClientId = hirerId,
			Message = message.Trim(),
			Status = ContactStatus.sent,
			CreatedAt = DateTime.UtcNow
		};

		_dbContext.Contacts.Add(contact);
		await _dbContext.SaveChangesAsync(ct);

		try{    
            await _emailSender.SendEmailAsync(
                Freelancer.Email,
                "New Contact Request",
                body
            );
        } catch(Exception ex)
        {
            // Log the exception (not implemented here)
            Console.WriteLine($"Failed to send email: {ex.Message}");
        }

        try
        {
            if(Freelancer.IsTelegramConnected && Freelancer.TelegramChatId != null)
            {
                await _telegramNotificationService.SendContactNotificationAsync(
                    Freelancer.TelegramChatId.Value,
                    body
                );
            }
            
        } catch(Exception ex)
        {
            // Log the exception (not implemented here)
            Console.WriteLine($"Failed to send Telegram notification: {ex.Message}");
        }

		return new ContactRequestDto
		{
			Id = contact.Id,
			FreelancerId = contact.FreelancerId,
			Message = contact.Message,
			Status = contact.Status,
			CreatedAt = contact.CreatedAt,
		};
	}

	public async Task<List<ContactRequestDto>> GetAllContactRequestsAsync(int hirerId, CancellationToken ct = default)
	{
		return await _dbContext.Contacts
					.AsNoTracking()
					.Where(contact => contact.ClientId == hirerId
						&& contact.Status == ContactStatus.sent)
					.Select(contact => new ContactRequestDto
					{
						Id = contact.Id,
						FreelancerId = contact.FreelancerId,
						Message = contact.Message,
						Status = contact.Status,
						CreatedAt = contact.CreatedAt,
					})
					.ToListAsync(ct);
	}

	public async Task<List<FreelancerDto>> GetAllFreelancersAsync(CancellationToken ct = default)
	{
		return await _dbContext.Users
			.AsNoTracking()
			.Where(user => user.Role == Role.Freelancer)
			.Select(user => new FreelancerDto
			(
				user.Id,
				user.FullName,
				user.Email,
				user.Rating,
				user.IsOnline,
				user.HourlyRate,
				user.Currency,
				user.Skills,
				user.CompletedOrders,
				new FreelancerContactsDto(
					user.Contacts != null ? user.Contacts.Telegram ?? string.Empty : string.Empty,
					user.Contacts != null ? user.Contacts.Phone ?? string.Empty : string.Empty,
					user.Email
				)
			))
			.ToListAsync(ct);
	}
}
