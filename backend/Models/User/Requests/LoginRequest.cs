using System.ComponentModel.DataAnnotations;

namespace backend;

public sealed record LoginRequest(
	[Required]
	[EmailAddress]
	string Email,
	[Required]
	string Password 
);
