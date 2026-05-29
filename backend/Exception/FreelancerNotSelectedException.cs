namespace backend;

public class FreelancerNotSelectedException : AppException
{
	public FreelancerNotSelectedException() : base("Заказчик не назначен.", "freelancer_not_selected") {}
	public FreelancerNotSelectedException(string message, string code) : base(message, code)
	{
	}
}
