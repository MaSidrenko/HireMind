namespace backend;

public class AiConversation
{
	public int Id { get; set; }
	public int? OrderId { get; set; }
	public Order? Order { get; set; }
	public int CreatedByUserId { get; set; }
	public User CreatedByUser { get; set; } = null!;
	public ConversationType ConversationType { get; set; }
	public List<AiMessage> Messages { get; set; } = new();
}
