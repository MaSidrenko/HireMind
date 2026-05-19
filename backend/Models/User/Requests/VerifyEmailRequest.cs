namespace backend;

public sealed record VerifyEmailRequest (
	string Email,
	string Code
);
