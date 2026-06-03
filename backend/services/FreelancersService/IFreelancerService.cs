namespace backend;

public interface IFreelancerService
{
	public Task<List<FreelancerDto>> GetAllFreelancersAsync(CancellationToken ct = default);
	public Task<List<ContactRequestDto>> GetAllContactRequestsAsync(int hirerId, CancellationToken ct = default);
	public Task<ContactRequestDto> CreateContactRequestAsync(int hirerId, int freelancerId, string message, CancellationToken ct = default);
}
