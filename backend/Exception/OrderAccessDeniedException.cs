namespace backend;

public class OrderAccessDeniedException : AppException
{
	public int OrderId { get; }

	public OrderAccessDeniedException(int orderId)
		: base("Проект не найден или недоступен.", "order_not_accessible")
	{
		OrderId = orderId;
	}

	public OrderAccessDeniedException(string message, string code) : base(message, code) {}
}
