namespace backend;

public sealed record FreelancerContactsDto(
	string Telegram,
	string Phone,
	string Email
);

public sealed record FreelancerDto(
	int id,
	string FullName,
	string email,
	double rating,
	bool isOnline,
	decimal hourlyRate,
	Currency Currency,
	List<string> skills,
	int completedProjects,
	FreelancerContactsDto Contacts
);
