using Telegram.Bot;
using Telegram.Bot.Exceptions;

namespace backend;

public sealed class TelegramPollingService : BackgroundService
{
	private const int PollingTimeoutSeconds = 30;
	private static readonly TimeSpan RetryDelay = TimeSpan.FromSeconds(3);

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
					timeout: PollingTimeoutSeconds,
					cancellationToken: stoppingToken
				);

				foreach (var update in updates)
				{
					offset = update.Id + 1;
					await _updateHandler.HandleAsync(update, stoppingToken);
				}
			}
			catch (RequestException ex) when (ContainsTimeout(ex))
			{
				_logger.LogWarning(
					ex,
					"Telegram polling request timed out while waiting for Bot API. Retrying in {DelaySeconds} seconds.",
					RetryDelay.TotalSeconds
				);
				await Task.Delay(RetryDelay, stoppingToken);
			}
			catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
			{
				break;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Telegram polling failed");
				await Task.Delay(RetryDelay, stoppingToken);
			}
		}
	}

	private static bool ContainsTimeout(Exception exception)
	{
		for (Exception? current = exception; current is not null; current = current.InnerException)
		{
			if (current is TimeoutException or TaskCanceledException)
			{
				return true;
			}
		}

		return false;
	}
}
