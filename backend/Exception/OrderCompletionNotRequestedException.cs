namespace backend;

public class OrderCompletionNotRequestedException : AppException
{
	public OrderCompletionNotRequestedException()
		: base("Исполнитель ещё не отметил заказ как готовый.", "order_completion_not_requested")
	{
	}

	public OrderCompletionNotRequestedException(string message, string code)
		: base(message, code)
	{
	}
}
