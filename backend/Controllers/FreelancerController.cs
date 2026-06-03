using System.Security.Claims;
using backend;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MyApp.Namespace
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Client")]
    public class FreelancerController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IEmailSender _emailService;
        private readonly ITelegramNotificationService _telegramNotificationService;
        public FreelancerController(AppDbContext db, IEmailSender emailService, ITelegramNotificationService telegramNotificationService)
        {
            _db = db;
            _emailService = emailService;
            _telegramNotificationService = telegramNotificationService;
        }

        [HttpGet("freelancers")]
        public async Task<IActionResult> GetAllFreelancers(CancellationToken ct = default)
        {
            List<FreelancerDto> user = await _db.Users
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

            // if(user is null)
            //     return NotFound("No Freelancer found"); 

            return Ok(user);       
        }
        [HttpGet("contact-requests")]
        public async Task<IActionResult> GetAllConact()
        {
            string? HirerId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if(!int.TryParse(HirerId, out int parsedHirerId))
            {
               return Unauthorized();
            }
            List<ContactRequestDto> contacts = await _db.Contacts
                            .AsNoTracking()
                            .Where(contact => contact.ClientId == parsedHirerId 
                                    && contact.Status == ContactStatus.sent)
                            .Select(contact => new ContactRequestDto
                            {
                                Id = contact.Id,
                                FreelancerId = contact.FreelancerId,
                                Message = contact.Message,
                                Status = contact.Status,
                                CreatedAt = contact.CreatedAt
                            })
                            .ToListAsync();

            return Ok(contacts);
        }
        [HttpPost("{freelancerId:int}/contact-requests")]
        public async Task<IActionResult> CreateContactRequest([FromBody] string message, [FromRoute] int freelancerId)
        {
            if(message is null || message.Trim().Length == 0)
            {
                return BadRequest("Message cannot be empty");
            }

            string? HirerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if(!int.TryParse(HirerId, out int parsedHirerId))
            {
               return Unauthorized();
            }
            User? Hirer = await _db.Users.FindAsync(parsedHirerId);

            if(Hirer is null || Hirer.Role != Role.Client)
            {
                return NotFound("Client not found");
            }


            User? Freelacner = await _db.Users.FindAsync(freelancerId);
            if(Freelacner is null || Freelacner.Role != Role.Freelancer)
            {
                return NotFound("Freelancer not found");
            }
            bool contactExists = await _db.Contacts
                        .AnyAsync(
                            contact => 
                                    contact.ClientId == parsedHirerId 
                                    && contact.FreelancerId == freelancerId 
                                    && contact.Status == ContactStatus.sent
                                    );

            if(contactExists)
            {
                return BadRequest("Contact request already exists");
            }
            string body = message.Trim() + 
                    $"\nContact the client at: {Hirer.Email}" 
                    + (!string.IsNullOrWhiteSpace(Hirer.Contacts?.Telegram) ? $"\nor via Telegram: {Hirer.Contacts.Telegram}" : string.Empty) 
                    + (!string.IsNullOrWhiteSpace(Hirer.Contacts?.Phone) ? $"\nor via Phone: {Hirer.Contacts.Phone}" : string.Empty);

            Contact contact = new Contact
            {
                FreelancerId = freelancerId,
                ClientId = parsedHirerId,
                Message = message.Trim(),
                Status = ContactStatus.sent,
                CreatedAt = DateTime.UtcNow
            };



            _db.Contacts.Add(contact);
            await _db.SaveChangesAsync();
            try
            {    
                await _emailService.SendEmailAsync(
                    Freelacner.Email,
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
                if(Freelacner.IsTelegramConnected && Freelacner.TelegramChatId != null)
                {
                    await _telegramNotificationService.SendContactNotificationAsync(
                        Freelacner.TelegramChatId.Value,
                        body
                    );
                }
                
            } catch(Exception ex)
            {
                // Log the exception (not implemented here)
                Console.WriteLine($"Failed to send Telegram notification: {ex.Message}");
            }
            
            return Ok(new ContactRequestDto
            {
                Id = contact.Id,
                FreelancerId = contact.FreelancerId,
                Message = contact.Message,
                Status = contact.Status,
                CreatedAt = contact.CreatedAt
            });
        }

    }
}
