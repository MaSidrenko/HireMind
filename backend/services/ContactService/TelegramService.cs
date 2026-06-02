using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace backend;

public class TelegramService : ITelegramService
{
	private const int TokenSizeInBytes = 32;
	private static readonly TimeSpan TokenLifetime = TimeSpan.FromMinutes(15);

	private readonly AppDbContext _db;
	private readonly TelegramBotOptions _botOptions;

	public TelegramService(AppDbContext db, TelegramBotOptions botOptions)
	{
		_db = db;
		_botOptions = botOptions;
	}

	public async Task<TelegramLinkCreateResult> CreateLinkTokenForUserAsync(int userId)
	{
		User? user = await _db.Users.FindAsync(userId);

		if (user is null)
		{
			return TelegramLinkCreateResult.Fail("User not found");
		}

		string? botUsername = ResolveBotUsername();

		if (string.IsNullOrWhiteSpace(botUsername))
		{
			return TelegramLinkCreateResult.Fail("Telegram bot username is not configured");
		}

		DateTime nowUtc = DateTime.UtcNow;

		List<TelegramLinkToken> activeTokens = await _db.TelegramLinkTokens
			.Where(item => item.UserId == userId && !item.IsUsed)
			.ToListAsync();

		foreach (TelegramLinkToken token in activeTokens)
		{
			token.IsUsed = true;
			token.UsedAt = nowUtc;
		}

		string rawToken = GenerateRawToken();
		DateTime expiresAtUtc = nowUtc.Add(TokenLifetime);

		TelegramLinkToken linkToken = new()
		{
			UserId = userId,
			TokenHash = HashToken(rawToken),
			CreatedAt = nowUtc,
			ExpiresAt = expiresAtUtc,
			IsUsed = false
		};

		_db.TelegramLinkTokens.Add(linkToken);
		await _db.SaveChangesAsync();

		string connectUrl = $"https://t.me/{botUsername}?start={rawToken}";

		return TelegramLinkCreateResult.Success(connectUrl, expiresAtUtc);
	}

	public async Task<TelegramLinkValidationResult> ValidateLinkTokenAsync(string rawToken)
	{
		if (string.IsNullOrWhiteSpace(rawToken))
		{
			return TelegramLinkValidationResult.Invalid(
				"empty_token",
				"Telegram link token is empty"
			);
		}

		TelegramLinkToken? token = await FindTokenByRawValueAsync(rawToken);

		if (token is null)
		{
			return TelegramLinkValidationResult.Invalid(
				"token_not_found",
				"Telegram link token was not found"
			);
		}

		if (token.IsUsed)
		{
			return TelegramLinkValidationResult.Invalid(
				"token_used",
				"Telegram link token has already been used"
			);
		}

		if (token.ExpiresAt <= DateTime.UtcNow)
		{
			return TelegramLinkValidationResult.Invalid(
				"token_expired",
				"Telegram link token has expired"
			);
		}

		return TelegramLinkValidationResult.Valid(token.UserId, token.ExpiresAt);
	}

	public async Task<TelegramLinkConsumeResult> ConsumeLinkTokenAsync(string rawToken, long chatId, string? telegramUsername)
	{
		TelegramLinkValidationResult validationResult = await ValidateLinkTokenAsync(rawToken);

		if (!validationResult.IsValid || validationResult.UserId is null)
		{
			return TelegramLinkConsumeResult.Fail(
				validationResult.ErrorMessage ?? "Telegram link token is invalid"
			);
		}

		TelegramLinkToken? token = await FindTokenByRawValueAsync(rawToken);

		if (token is null)
		{
			return TelegramLinkConsumeResult.Fail("Telegram link token was not found");
		}

		User? user = await _db.Users.FindAsync(validationResult.UserId.Value);

		if (user is null)
		{
			return TelegramLinkConsumeResult.Fail("User not found");
		}

		bool chatIsAlreadyLinked = await _db.Users.AnyAsync(item =>
			item.Id != user.Id && item.TelegramChatId == chatId
		);

		if (chatIsAlreadyLinked)
		{
			return TelegramLinkConsumeResult.Fail("Telegram chat is already linked to another user");
		}

		user.TelegramChatId = chatId;
		user.TelegramUsername = string.IsNullOrWhiteSpace(telegramUsername)
			? null
			: telegramUsername.Trim();
		user.IsTelegramConnected = true;

		token.IsUsed = true;
		token.UsedAt = DateTime.UtcNow;

		await _db.SaveChangesAsync();

		return TelegramLinkConsumeResult.Success(user.Id);
	}

	private string? ResolveBotUsername()
	{
		return _botOptions.BotUsername;
	}

	private async Task<TelegramLinkToken?> FindTokenByRawValueAsync(string rawToken)
	{
		string tokenHash = HashToken(rawToken);

		return await _db.TelegramLinkTokens.FirstOrDefaultAsync(item => item.TokenHash == tokenHash);
	}

	private static string GenerateRawToken()
	{
		byte[] bytes = RandomNumberGenerator.GetBytes(TokenSizeInBytes);
		string token = Convert.ToBase64String(bytes);

		return token
			.TrimEnd('=')
			.Replace('+', '-')
			.Replace('/', '_');
	}

	private static string HashToken(string rawToken)
	{
		byte[] bytes = Encoding.UTF8.GetBytes(rawToken);
		byte[] hash = SHA256.HashData(bytes);
		return Convert.ToHexString(hash);
	}
}
