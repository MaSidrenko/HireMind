using System.ComponentModel.DataAnnotations;
using System.Runtime.InteropServices;

namespace backend;
/// <summary>
/// Record for sing-up request.
/// </summary>
public record class CreateUserRequest(
	[Required]
	[StringLength(50, MinimumLength = 5)]
	string FullName,
	[Required]
	[EmailAddress]
	string Email,
	[Required]
	[StringLength(128)]
	string Password,
	[Required]
	Role Role,
	Contacts? Contacts,
	string? CompanyName
);
