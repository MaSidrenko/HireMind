using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace backend;

public class ProfileSerivce : IProfileSerivce
{
	private readonly AppDbContext _db;
	public ProfileSerivce(AppDbContext db)
	{
		_db = db;
	}
	public async Task<User> UpdateProfileAsync(UpdateProfileRequest request, int userId, CancellationToken ct)
	{
		User? user = await _db.Users.FirstOrDefaultAsync(item => item.Id == userId, ct);

		if(user is null) throw new UserNotFoundException(userId);

		if(string.IsNullOrWhiteSpace(request.FullName))
			throw new EmptyFullNameException();

		if(string.IsNullOrWhiteSpace(request.Contacts?.Telegram)
			&& string.IsNullOrWhiteSpace(request.Contacts?.Phone))
			throw new EmptyContactsException();

		string normalizedEmail = request.Email.Trim().ToLowerInvariant();

		if(!new EmailAddressAttribute().IsValid(normalizedEmail))
			throw new InvalidEmailException();

		bool emailTaken = await _db.Users.AnyAsync(
			item => item.Id != userId && item.Email == normalizedEmail,
			ct
		);

		if(emailTaken)
			throw new EmailExsistsException();

		if(user.Role == Role.Client && string.IsNullOrWhiteSpace(request.CompanyName))
			throw new NullCompanyException();

		user.Email = normalizedEmail;
		user.FullName = request.FullName.Trim();
		user.Contacts = new Contacts
		{
			Telegram = request.Contacts.Telegram?.Trim(),
			Phone = request.Contacts.Phone?.Trim()
		};

		if(user.Role == Role.Client)
		{
			user.CompanyName = request.CompanyName.Trim();
			user.Skills = new List<string>();
		}
		else
		{
			user.CompanyName = null;
			user.Skills = NormalizeSkills(request.Skills);
		}

		await _db.SaveChangesAsync(ct);

		return user;
	}

	public async Task<User> UpdateSkillsAsync(UpdateProfileSkillsRequest request, int userId, CancellationToken ct)
	{
		User? user = await _db.Users.FirstOrDefaultAsync(item => item.Id == userId, ct);

		if(user is null)
			throw new UserNotFoundException(userId);

		user.Skills = NormalizeSkills(request.Skills);

		await _db.SaveChangesAsync(ct);

		return user;
	}
	public static List<string> NormalizeSkills(IEnumerable<string>? skills)
	{
		return skills?
			.Select(skill => skill.Trim())
			.Where(skill => !string.IsNullOrWhiteSpace(skill))
			.Distinct(StringComparer.OrdinalIgnoreCase)
			.Take(20)
			.ToList()
			?? new List<string>();
	}
}
