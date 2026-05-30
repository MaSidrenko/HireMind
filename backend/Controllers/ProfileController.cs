using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using backend;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MyApp.Namespace;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ProfileController : ControllerBase
{
	private readonly IProfileSerivce _profileService;

	public ProfileController(IProfileSerivce profileSerivce)
	{
		_profileService = profileSerivce;
	}

	[HttpPut]
	public async Task<IActionResult> UpdateProfile(
		[FromBody] UpdateProfileRequest request,
		CancellationToken ct)
	{
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
			user.Contacts,
			user.CompanyName,
			user.Skills,
			user.CreatedAt,
			user.LastSeenAt,
			user.IsOnline
		);
	}
}
