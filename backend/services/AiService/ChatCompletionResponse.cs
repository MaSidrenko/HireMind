using System.Text.Json.Serialization;

namespace backend;

public class ChatCompletionResponse
{
	[JsonPropertyName("choices")]
	public List<ChatChoice>? Choices { get; set; }
}
