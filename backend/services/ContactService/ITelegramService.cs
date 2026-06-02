namespace backend;

public interface ITelegramService
{
	public Task<TelegramLinkCreateResult> CreateLinkTokenForUserAsync(int userId);
	public Task<TelegramLinkValidationResult> ValidateLinkTokenAsync(string rawToken);
	public Task<TelegramLinkConsumeResult> ConsumeLinkTokenAsync(string rawToken, long chatId, string? telegramUsername);
}
