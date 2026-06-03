using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace backend;

public sealed class SmtpEmailSender : IEmailSender
{
	private readonly string _fromName;
	private readonly string _fromAddress;
	private readonly string _smtpHost;
	private readonly int _smtpPort;
	private readonly string _username;
	private readonly string _password;

	public SmtpEmailSender(IConfiguration configuration)
	{
		_username = GetRequiredSetting(configuration, "Email:Username");
		_password = GetRequiredSetting(configuration, "Email:Password");
		_fromName = GetOptionalSetting(configuration, "Email:FromName", "HireMind");
		_fromAddress = GetOptionalSetting(configuration, "Email:From", _username);
		_smtpHost = GetOptionalSetting(configuration, "Email:SmtpHost", "smtp.gmail.com");
		_smtpPort = GetOptionalIntSetting(configuration, "Email:SmtpPort", 587);
	}

	public async Task SendEmailAsync(string to, string subject, string body)
	{
		var message = new MimeMessage();

		message.From.Add(new MailboxAddress(
			_fromName,
			_fromAddress
		));

		message.To.Add(MailboxAddress.Parse(to));
		message.Subject = subject;

		message.Body = new TextPart("plain")
		{
			Text = body
		};

	 	using var client = new SmtpClient();

	        await client.ConnectAsync(
	            _smtpHost,
	            _smtpPort,
	            SecureSocketOptions.StartTls
	        );

	        await client.AuthenticateAsync(
	            _username,
	            _password
	        );

	        await client.SendAsync(message);
	        await client.DisconnectAsync(true);
	}

	private static string GetRequiredSetting(IConfiguration configuration, string key)
	{
		string? value = configuration[key];
		if (string.IsNullOrWhiteSpace(value))
		{
			throw new InvalidOperationException($"{key} is missing.");
		}

		return value;
	}

	private static string GetOptionalSetting(IConfiguration configuration, string key, string fallback)
	{
		string? value = configuration[key];
		return string.IsNullOrWhiteSpace(value) ? fallback : value;
	}

	private static int GetOptionalIntSetting(IConfiguration configuration, string key, int fallback)
	{
		string? value = configuration[key];
		if (string.IsNullOrWhiteSpace(value))
		{
			return fallback;
		}

		if (!int.TryParse(value, out int parsed))
		{
			throw new InvalidOperationException($"{key} must be a valid integer.");
		}

		return parsed;
	}
}
