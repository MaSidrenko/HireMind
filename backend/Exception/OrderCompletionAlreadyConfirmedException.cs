namespace backend;

public class OrderCompletionAlreadyConfirmedException : AppException
{
	public OrderCompletionAlreadyConfirmedException()
		: base("Готовность заказа уже подтверждена заказчиком.", "order_completion_already_confirmed")
	{
	}

	public OrderCompletionAlreadyConfirmedException(string message, string code)
		: base(message, code)
	{
	}
}
