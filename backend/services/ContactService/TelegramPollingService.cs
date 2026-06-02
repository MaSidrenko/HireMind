using Telegram.Bot;

namespace backend;

public sealed class TelegramPollingService : BackgroundService
{
	private readonly ITelegramBotClient _botClient;
	private readonly TelegramUpdateHandler _updateHandler;
	private readonly ILogger<TelegramPollingService> _logger;

	public TelegramPollingService(
		ITelegramBotClient botClient,
		TelegramUpdateHandler updateHandler,
		ILogger<TelegramPollingService> logger)
	{
		_botClient = botClient;
		_updateHandler = updateHandler;
		_logger = logger;
	}

	protected override async Task ExecuteAsync(CancellationToken stoppingToken)
	{
		int offset = 0;

		while (!stoppingToken.IsCancellationRequested)
		{
			try
			{
				var updates = await _botClient.GetUpdates(
					offset: offset,
					timeout: 30,
					cancellationToken: stoppingToken
				);

				foreach (var update in updates)
				{
					offset = update.Id + 1;
					await _updateHandler.HandleAsync(update, stoppingToken);
				}
			}
			catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
			{
				break;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Telegram polling failed");
				await Task.Delay(TimeSpan.FromSeconds(3), stoppingToken);
			}
		}
	}
}
