using System.Text.Json.Serialization;

namespace backend;

public class ChatChoice
{
	[JsonPropertyName("message")]
	public ChatMessage? Message { get; set; }
}
