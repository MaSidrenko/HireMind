namespace backend;

public interface ITelegramNotificationService
{
	public Task SendContactNotificationAsync(long chatId, string telegramText, CancellationToken cancellationToken = default);
}
