namespace backend;

public class OrderStatusUpdateUnavailableException : AppException
{
	public OrderStatusUpdateUnavailableException()
		: base("Этот статус нельзя установить через общее обновление заказа.", "order_status_update_unavailable")
	{
	}

	public OrderStatusUpdateUnavailableException(string message, string code)
		: base(message, code)
	{
	}
}
