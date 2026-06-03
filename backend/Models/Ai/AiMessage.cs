namespace backend;

public class AiMessage
{
	public int Id { get; set; }
	public int ConversationId { get; set; }
	public AiConversation Conversation { get; set; } = null!;
	public int? AuthorUserId { get; set; }
	public User? AuthorUser { get; set; }
	public MessageRoleAi MessageRole { get; set; }
	public string Content { get; set; } = string.Empty;
	public string PromptVersion { get; set; } = string.Empty;
}
