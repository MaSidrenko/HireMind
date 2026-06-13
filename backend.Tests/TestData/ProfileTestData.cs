namespace backend.Tests;

public sealed class ProfileTestData
{
	public static User CreateFreelancerUser(int id)
	{
		return new User
		{
			Id = id,
			Email = "test@example.com",
			FullName = "Test User",
			Role = Role.Freelancer,
			Contacts = new Contacts
			{
				Telegram = "@testuser"
			},
			Skills = ["C#", "ASP.NET Core"],
			HourlyRate = 1500,
			Currency = Currency.USD,
			CompletedOrders = 3,
			CreatedAt = DateTime.UtcNow.AddDays(-10),
			LastSeenAt = DateTime.UtcNow,
			IsOnline = true,
			IsTelegramConnected = false,
			Rating = 5
		};
	}

	public static User CreateClientUser(int id)
	{
		return new User
		{
			Id = id,
			Email = "test@example.com",
			FullName = "Test Client",
			Role = Role.Client,
			Contacts = new Contacts
			{
				Telegram = "@testClient"
			},
			CreatedAt = DateTime.UtcNow.AddDays(-10),
			LastSeenAt = DateTime.UtcNow,
			IsOnline = true,
			IsTelegramConnected = false,
			Rating = 3.4
		};
	}

	public static ContactRequestDto CreateContactRequestDto(int id)
	{
		return new ContactRequestDto
		{
			Id =id,
			FreelancerId = 1,
			Message = "Hello from test",
			Status = ContactStatus.sent,
			CreatedAt = DateTime.UtcNow.AddDays(-5)
		};
	}
}
