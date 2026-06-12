using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Moq;

namespace backend.Tests;

public class TestApplicationFactory : WebApplicationFactory<Program>
{
	public Mock<IProfileSerivce> ProfileServiceMock { get; } = new(MockBehavior.Strict);
	public Mock<ITelegramLinkService> TelegramServiceMock { get; } = new(MockBehavior.Strict);
	public Mock<IFreelancerService> FreelancerServiceMock { get; } = new(MockBehavior.Strict);
	protected override void ConfigureWebHost(IWebHostBuilder builder)
	{
		builder.UseEnvironment("Testing");

		builder.ConfigureTestServices(services =>
		{
			services.
				AddAuthentication(options =>
				{
					options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
					options.DefaultChallengeScheme = TestAuthHandler.SchemeName;
					options.DefaultForbidScheme = TestAuthHandler.SchemeName;
				})
				.AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
					TestAuthHandler.SchemeName,
					_ => {});
				
				services.RemoveAll<IProfileSerivce>();
				services.RemoveAll<ITelegramLinkService>();
				services.RemoveAll<IFreelancerService>();

				services.AddSingleton(ProfileServiceMock.Object);
				services.AddSingleton(TelegramServiceMock.Object);
				services.AddSingleton(FreelancerServiceMock.Object);
		});
	}
}
