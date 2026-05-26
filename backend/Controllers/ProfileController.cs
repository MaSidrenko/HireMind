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
	private readonly AppDbContext _db;

	public ProfileController(AppDbContext db)
	{
		_db = db;
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

		User? user = await _db.Users.FirstOrDefaultAsync(item => item.Id == userId, ct);

		if (user is null)
		{
			return Unauthorized();
		}

		if (string.IsNullOrWhiteSpace(request.FullName))
		{
			return BadRequest(new
			{
				message = "Укажите имя пользователя."
			});
		}

		if (string.IsNullOrWhiteSpace(request.Contacts?.Telegram)
			&& string.IsNullOrWhiteSpace(request.Contacts?.Phone))
		{
			return BadRequest(new
			{
				message = "Укажите Telegram или телефон."
			});
		}

		string normalizedEmail = request.Email.Trim().ToLowerInvariant();

		if (!new EmailAddressAttribute().IsValid(normalizedEmail))
		{
			return BadRequest(new
			{
				message = "Введите корректный email."
			});
		}

		bool emailTaken = await _db.Users.AnyAsync(
			item => item.Id != userId && item.Email == normalizedEmail,
			ct);

		if (emailTaken)
		{
			return Conflict(new
			{
				message = "Email уже используется."
			});
		}

		if (request.Role == Role.Admin)
		{
			return BadRequest(new
			{
				message = "Недопустимая роль пользователя."
			});
		}

		if (request.Role == Role.Client && string.IsNullOrWhiteSpace(request.CompanyName))
		{
			return BadRequest(new
			{
				message = "Введите название компании."
			});
		}

		user.Email = normalizedEmail;
		user.FullName = request.FullName.Trim();
		user.Role = request.Role;
		user.Contacts = new Contacts
		{
			Telegram = request.Contacts.Telegram?.Trim(),
			Phone = request.Contacts.Phone?.Trim(),
		};

		if (request.Role == Role.Client)
		{
			user.CompanyName = request.CompanyName?.Trim();
			user.Skills = new List<string>();
		}
		else
		{
			user.CompanyName = null;
			user.Skills = NormalizeSkills(request.Skills);
		}

		await _db.SaveChangesAsync(ct);

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

		User? user = await _db.Users.FirstOrDefaultAsync(item => item.Id == userId, ct);

		if (user is null)
		{
			return Unauthorized();
		}

		user.Skills = NormalizeSkills(request.Skills);

		await _db.SaveChangesAsync(ct);

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

	private static List<string> NormalizeSkills(IEnumerable<string>? skills)
	{
		return skills?
			.Select(skill => skill.Trim())
			.Where(skill => !string.IsNullOrWhiteSpace(skill))
			.Distinct(StringComparer.OrdinalIgnoreCase)
			.Take(20)
			.ToList()
			?? new List<string>();
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
