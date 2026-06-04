namespace backend;

public class AiRequestFailedException : AppException
{
	public int UpstreamStatusCode { get; }

	public AiRequestFailedException(int upstreamStatusCode, string? details)
		: base(
			string.IsNullOrWhiteSpace(details)
				? "AI provider request failed."
				: $"AI provider request failed: {details}",
			"ai_request_failed")
	{
		UpstreamStatusCode = upstreamStatusCode;
	}
}
