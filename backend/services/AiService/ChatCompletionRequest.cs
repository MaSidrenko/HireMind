using System.Text.Json.Serialization;

namespace backend;

public class ChatCompletionRequest
{
	[JsonPropertyName("model")]
	public string Model { get; set; } = string.Empty;

	[JsonPropertyName("messages")]
	public List<ChatMessage> Messages { get; set; } = [];

	[JsonPropertyName("temperature")]
	public double Temperature { get; set; } = 0.5;

	[JsonPropertyName("max_tokens")]
	public int MaxTokens { get; set; } = 1200;

	[JsonPropertyName("reasoning_effort")]
	public string ReasoningEffort { get; set; } = "none";
}
