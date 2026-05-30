namespace backend;

public interface IProfileSerivce
{
	public Task<User> UpdateProfileAsync(UpdateProfileRequest request, int userId, CancellationToken ct);
	public Task<User> UpdateSkillsAsync(UpdateProfileSkillsRequest request, int userId, CancellationToken ct);
	// public List<string> NormalizeSkills(IEnumerable<string>? skills);
}
