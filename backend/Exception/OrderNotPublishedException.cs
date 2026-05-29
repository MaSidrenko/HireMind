namespace backend;

public class OrderNotPublishedException : AppException
{

	public OrderNotPublishedException() : base("Заказ не опубликован", "order_not_published") {}
	public OrderNotPublishedException(string message, string code) : base(message, code)
	{
	}
}
