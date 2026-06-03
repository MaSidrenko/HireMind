using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using backend;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MyApp.Namespace;

[Route("api/v1/[controller]")]
[ApiController]
[Authorize]
public class ProfileController : ControllerBase
{
	private readonly IProfileSerivce _profileService;
	private readonly ITelegramLinkService _telegramService;

	public ProfileController(IProfileSerivce profileSerivce, ITelegramLinkService telegramService)
	{
		_profileService = profileSerivce;
		_telegramService = telegramService;
	}

	[HttpPut]
	public async Task<IActionResult> UpdateProfile(
		[FromBody] UpdateProfileRequest request,
		CancellationToken ct)
	{
		if (request.HourlyRate is < 0)
		{
			return BadRequest(new
			{
				message = "Почасовая ставка не может быть отрицательной."
			});
		}

		if (!TryGetUserId(out int userId))
		{
			return Unauthorized();
		}

		User? user = await _profileService.UpdateProfileAsync(request, userId, ct);

		return Ok(new
		{
			user = ToDto(user)
		});
	}

	[HttpPatch("skills")]
	[Authorize(Roles = "Freelancer")]
	public async Task<IActionResult> UpdateSkills(
		[FromBody] UpdateProfileSkillsRequest request,
		CancellationToken ct)
	{
		if (!TryGetUserId(out int userId))
		{
			return Unauthorized();
		}

		User? user = await _profileService.UpdateSkillsAsync(request, userId, ct);

		return Ok(new
		{
			user = ToDto(user)
		});
	}

	[HttpPost("telegram/connect-link")]
	public async Task<IActionResult> CreateTelegramConnectLink()
	{
		if (!TryGetUserId(out int userId))
		{
			return Unauthorized();
		}

		TelegramLinkCreateResult result = await _telegramService.CreateLinkTokenForUserAsync(userId);

		if (!result.IsSuccess || string.IsNullOrWhiteSpace(result.ConnectUrl) || result.ExpiresAtUtc is null)
		{
			return BadRequest(new
			{
				message = result.ErrorMessage ?? "Не удалось создать ссылку для подключения Telegram"
			});
		}

		return Ok(new
		{
			connectUrl = result.ConnectUrl,
			expiresAtUtc = result.ExpiresAtUtc
		});
	}

	private bool TryGetUserId(out int userId)
	{
		string? userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
		return int.TryParse(userIdValue, out userId);
	}

	private static UserDto ToDto(User user)
	{
		return new UserDto(
			user.Id,
			user.Email,
			user.FullName,
			user.Role,
			user.Rating,
			user.Contacts,
			user.CompanyName,
			user.Skills,
			user.Role == Role.Freelancer ? user.HourlyRate : null,
			user.Role == Role.Freelancer ? user.Currency : null,
			user.Role == Role.Freelancer ? user.CompletedOrders : null,
			user.CreatedAt,
			user.LastSeenAt,
			user.IsOnline,
			user.IsTelegramConnected
		);
	}
}
