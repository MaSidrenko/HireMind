namespace backend;

public class OrderCompletionUnavailableException : AppException
{
	public OrderCompletionUnavailableException()
		: base("Завершение заказа недоступно в текущем статусе.", "order_completion_unavailable")
	{
	}

	public OrderCompletionUnavailableException(string message, string code)
		: base(message, code)
	{
	}
}
