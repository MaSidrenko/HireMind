namespace backend;

public sealed record TelegramLinkValidationResult
{
	public bool IsValid { get; init; }
	public string? ErrorCode { get; init; }
	public string? ErrorMessage { get; init; }
	public int? UserId { get; init; }
	public DateTime? ExpiresAtUtc { get; init; }

	public static TelegramLinkValidationResult Invalid(string errorCode, string errorMessage)
	{
		return new TelegramLinkValidationResult
		{
			IsValid = false,
			ErrorCode = errorCode,
			ErrorMessage = errorMessage
		};
	}

	public static TelegramLinkValidationResult Valid(int userId, DateTime expiresAtUtc)
	{
		return new TelegramLinkValidationResult
		{
			IsValid = true,
			UserId = userId,
			ExpiresAtUtc = expiresAtUtc
		};
	}
}
