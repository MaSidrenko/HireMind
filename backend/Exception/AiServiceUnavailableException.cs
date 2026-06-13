namespace backend;

public class AiServiceUnavailableException : AppException
{
	public AiServiceUnavailableException()
		: base(
			"AI функции временно недоступны. Проверьте настройку GROQ_API_KEY.",
			"ai_service_unavailable")
	{
	}
}
