namespace backend;

public class ContactRequestDto
{
	public int Id { get; set; }
	public int FreelancerId { get; set; }
	public string Message { get; set; } = string.Empty;
	public ContactStatus Status { get; set; }
	public DateTime CreatedAt { get; set; } 
}
