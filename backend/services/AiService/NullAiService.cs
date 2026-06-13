namespace backend;

public class NullAiService : IAiService
{
	public Task<AiBriefResult> GenerateAiBriefAsync(
		int ownerId,
		GenerateAiBriefRequest request,
		CancellationToken ct = default)
	{
		throw new AiServiceUnavailableException();
	}

	public Task<AskAiResponse> ResponesToAi(
		int orderId,
		int ownerId,
		string userMessage,
		CancellationToken ct = default)
	{
		throw new AiServiceUnavailableException();
	}
}
