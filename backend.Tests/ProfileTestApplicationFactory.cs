using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Moq;

namespace backend.Tests;

public class TestApplicationFactory : WebApplicationFactory<Program>
{
	private readonly bool _useTestAuthentication;
	private readonly IReadOnlyDictionary<string, string?>? _configurationOverrides;

	public Mock<IProfileSerivce> ProfileServiceMock { get; } = new(MockBehavior.Strict);
	public Mock<ITelegramLinkService> TelegramServiceMock { get; } = new(MockBehavior.Strict);
	public Mock<IFreelancerService> FreelancerServiceMock { get; } = new(MockBehavior.Strict);
	public Mock<IAiService> AiServiceMock { get; } = new(MockBehavior.Strict);
	public Mock<IAuthService> AuthServiceMock { get; } = new(MockBehavior.Strict);
	public Mock<IEmailSender> EmailSenderMock { get; } = new(MockBehavior.Strict);
	public Mock<IOrderService> OrderServiceMock { get; } = new(MockBehavior.Strict);

	public TestApplicationFactory(
		bool useTestAuthentication = true,
		IReadOnlyDictionary<string, string?>? configurationOverrides = null)
	{
		_useTestAuthentication = useTestAuthentication;
		_configurationOverrides = configurationOverrides;
	}

	protected override void ConfigureWebHost(IWebHostBuilder builder)
	{
		builder.UseEnvironment("Testing");
		builder.ConfigureAppConfiguration((_, config) =>
		{
			if (_configurationOverrides is not null)
			{
				config.AddInMemoryCollection(_configurationOverrides);
			}
		});

		builder.ConfigureTestServices(services =>
		{
			if (_useTestAuthentication)
			{
				services
				.AddAuthentication(options =>
				{
					options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
					options.DefaultChallengeScheme = TestAuthHandler.SchemeName;
					options.DefaultForbidScheme = TestAuthHandler.SchemeName;
				})
				.AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
					TestAuthHandler.SchemeName,
					_ => {});
			}
				
				services.RemoveAll<IProfileSerivce>();
				services.RemoveAll<ITelegramLinkService>();
				services.RemoveAll<IFreelancerService>();
				services.RemoveAll<IAiService>();
				services.RemoveAll<IAuthService>();
				services.RemoveAll<IEmailSender>();
				services.RemoveAll<IOrderService>();

				services.AddSingleton(ProfileServiceMock.Object);
				services.AddSingleton(TelegramServiceMock.Object);
				services.AddSingleton(FreelancerServiceMock.Object);
				services.AddSingleton(AiServiceMock.Object);
				services.AddSingleton(AuthServiceMock.Object);
				services.AddSingleton(EmailSenderMock.Object);
				services.AddSingleton(OrderServiceMock.Object);
		});
	}
}
