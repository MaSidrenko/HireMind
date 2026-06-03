using System.Security.Claims;
using backend;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MyApp.Namespace
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize(Roles = "Client")]
    public class FreelancerController : ControllerBase
    {
        private readonly IFreelancerService _freelancerService;
        public FreelancerController(IFreelancerService freelancerService)
        {
            _freelancerService = freelancerService;
        }

        [HttpGet("freelancers")]
        public async Task<IActionResult> GetAllFreelancers(CancellationToken ct = default)
        {
            List<FreelancerDto> user = await _freelancerService.GetAllFreelancersAsync(ct);
            return Ok(user);       
        }
        [HttpGet("contact-requests")]
        public async Task<IActionResult> GetAllConact(CancellationToken ct = default)
        {
            string? HirerId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if(!int.TryParse(HirerId, out int parsedHirerId))
            {
               return Unauthorized();
            }

            List<ContactRequestDto> contacts = await _freelancerService.GetAllContactRequestsAsync(parsedHirerId, ct);

            return Ok(contacts);
        }
        [HttpPost("{freelancerId:int}/contact-requests")]
        public async Task<IActionResult> CreateContactRequest([FromBody] string message, [FromRoute] int freelancerId, CancellationToken ct = default)
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
            ContactRequestDto contact = await _freelancerService
                    .CreateContactRequestAsync(parsedHirerId, 
                            freelancerId, message.Trim(), ct);
            
            return Ok(contact);
        }

    }
}
