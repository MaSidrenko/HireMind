namespace backend;

public class OrderDeletionUnavailableException : AppException
{
	public OrderDeletionUnavailableException()
		: base("Нельзя удалить заказ, пока он связан с откликами, AI-диалогами или выбранным исполнителем.", "order_deletion_unavailable")
	{
	}

	public OrderDeletionUnavailableException(string message, string code = "order_deletion_unavailable")
		: base(message, code)
	{
	}
}
