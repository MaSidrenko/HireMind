namespace backend;

public sealed record TelegramLinkConsumeResult
{
	public bool IsSuccess { get; init; }
	public string? ErrorMessage { get; init; }
	public int? UserId { get; init; }

	public static TelegramLinkConsumeResult Fail(string message)
	{
		return new TelegramLinkConsumeResult
		{
			IsSuccess = false,
			ErrorMessage = message
		};
	}

	public static TelegramLinkConsumeResult Success(int userId)
	{
		return new TelegramLinkConsumeResult
		{
			IsSuccess = true,
			UserId = userId
		};
	}
}
