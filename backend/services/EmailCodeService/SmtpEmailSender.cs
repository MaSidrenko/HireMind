using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace backend;

public sealed class SmtpEmailSender : IEmailSender
{
	private readonly IConfiguration _configuration;

	public SmtpEmailSender(IConfiguration configuration)
	{
		_configuration = configuration;
	}

	public async Task SendEmailAsync(string to, string subject, string body)
	{
		var message = new MimeMessage();

		message.From.Add(new MailboxAddress(
			_configuration["Email:FromName"],
			_configuration["Email:From"]
		));

		message.To.Add(MailboxAddress.Parse(to));
		message.Subject = subject;

		message.Body = new TextPart("plain")
		{
			Text = body
		};

	 	using var client = new SmtpClient();

        await client.ConnectAsync(
            _configuration["Email:SmtpHost"],
            int.Parse(_configuration["Email:SmtpPort"]!),
            SecureSocketOptions.StartTls
        );

        await client.AuthenticateAsync(
            _configuration["Email:Username"],
            _configuration["Email:Password"]
        );

        await client.SendAsync(message);
        await client.DisconnectAsync(true);
	}

}
