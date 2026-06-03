namespace backend;

public sealed class NullTelegramNotificationService : ITelegramNotificationService
{
	public Task SendContactNotificationAsync(long chatId, string telegramText, CancellationToken cancellationToken = default)
	{
		return Task.CompletedTask;
	}
}
