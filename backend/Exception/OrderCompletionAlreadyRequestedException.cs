namespace backend;

public class OrderCompletionAlreadyRequestedException : AppException
{
	public OrderCompletionAlreadyRequestedException()
		: base("Исполнитель уже отметил заказ как готовый.", "order_completion_already_requested")
	{
	}

	public OrderCompletionAlreadyRequestedException(string message, string code)
		: base(message, code)
	{
	}
}
