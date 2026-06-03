namespace backend;

public class Contact
{
	public int Id { get; set; }
	public int FreelancerId { get; set; }
	public int ClientId { get; set; }
	public string Message { get; set; }
	public ContactStatus Status { get; set; }
	public DateTime CreatedAt { get; set; }
}
