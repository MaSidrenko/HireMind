using Telegram.Bot;

namespace backend;

public class TelegramNotificationService : ITelegramNotificationService
{

	private readonly ITelegramBotClient _telegramBotClient;

	public TelegramNotificationService(ITelegramBotClient telegramBotClient)
	{
		_telegramBotClient = telegramBotClient;
	}
	public async Task SendContactNotificationAsync(long chatId, string telegramText, CancellationToken cancellationToken = default)
	{
		await _telegramBotClient.SendMessage(chatId, telegramText, cancellationToken: cancellationToken);
	}
}
