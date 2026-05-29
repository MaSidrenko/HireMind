namespace backend;

public class FreelancerAlreadySelectedException : AppException
{
	public FreelancerAlreadySelectedException() : base("Исполнитель уже выбран", "freelancer_already_selected") {}
	public FreelancerAlreadySelectedException(string message, string code) : base(message, code)
	{
	}
}
