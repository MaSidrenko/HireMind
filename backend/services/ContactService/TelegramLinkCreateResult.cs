namespace backend;

public sealed record TelegramLinkCreateResult
{
	public bool IsSuccess { get; init; }
	public string? ErrorMessage { get; init; }
	public string? ConnectUrl { get; init; }
	public DateTime? ExpiresAtUtc { get; init; }

	public static TelegramLinkCreateResult Fail(string message)
	{
		return new TelegramLinkCreateResult
		{
			IsSuccess = false,
			ErrorMessage = message
		};
	}

	public static TelegramLinkCreateResult Success(string connectUrl, DateTime expiresAtUtc)
	{
		return new TelegramLinkCreateResult
		{
			IsSuccess = true,
			ConnectUrl = connectUrl,
			ExpiresAtUtc = expiresAtUtc
		};
	}
}
