namespace backend;

public class OrderNotFoundException : AppException
{
	public int OrderID { get; }
	public OrderNotFoundException(int orderId) : base($"Заказ с ID {orderId} не найден.", "order_not_found")
	{
		OrderID = orderId;
	}

	public OrderNotFoundException(string message, string code) : base(message, code) {}
}
