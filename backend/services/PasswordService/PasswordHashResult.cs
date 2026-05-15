namespace backend;
/// <summary>
/// Record for result of hash algorithm
/// </summary>
public record class PasswordHashResult(
	string Hash,
	string Salt
);
