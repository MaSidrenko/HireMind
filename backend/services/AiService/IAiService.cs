namespace backend;

public interface IAiService
{
	public Task<AiBriefResult> GenerateAiBriefAsync(int ownerId, GenerateAiBriefRequest request, CancellationToken ct = default);
	public Task<AskAiResponse> ResponesToAi(int orderId,int ownerId, string userMessage, CancellationToken ct = default);
}
