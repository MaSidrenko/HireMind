using System.Security.Claims;
using backend;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MyApp.Namespace
{
    [Route("api/v1/ai")]
    [ApiController]
    [Authorize(Roles = "Client, Admin")]
	    public class AiController : ControllerBase
	    {
	        private readonly IAiService _aiService;

	        public AiController(IAiService aiService)
	        {
	            _aiService = aiService;
	        }
	        [HttpPost("briefs/generate")]
	        public async Task<IActionResult> GenerateBrief(
	                [FromBody] GenerateAiBriefRequest request,
	                CancellationToken ct)
	        {
	            if (string.IsNullOrWhiteSpace(request.Title) ||
	                string.IsNullOrWhiteSpace(request.Category) ||
	                string.IsNullOrWhiteSpace(request.RawDescription))
	            {
	                return BadRequest(new
	                {
	                    message = "Title, category and rawDescription are required."
	                });
	            }

                string? hirerId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if(!int.TryParse(hirerId, out int parsedHirerId))
                {
                   return Unauthorized();
                }

	            AiBriefResult result = await _aiService.GenerateAiBriefAsync(parsedHirerId, request, ct);
	            return Ok(result);
	        }
	        [HttpPost("project-assistant")]
	        public async Task<IActionResult> ProjectAssistant(
	                [FromBody] ProjectAssistantRequest request,
	                CancellationToken ct)
	        {
	            if (string.IsNullOrWhiteSpace(request.Prompt))
	            {
	                return BadRequest(new
	                {
	                    message = "Prompt is required."
	                });
	            }

                string? HirerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                
                if(!int.TryParse(HirerId, out int parsedHirerId))
                {
                   return Unauthorized();
                }

	            AskAiResponse askAiResponse = await _aiService
                        .ResponesToAi(request.ProjectId,parsedHirerId, request.Prompt, ct);
	            return Ok(askAiResponse);
	        }
	    }
	}
