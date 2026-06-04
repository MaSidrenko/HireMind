namespace backend;

public class AiInvalidResponseException : AppException
{
	public AiInvalidResponseException()
		: base("AI provider returned an empty or invalid response.", "ai_invalid_response")
	{
	}

	public AiInvalidResponseException(string message, string code)
		: base(message, code)
	{
	}
}
