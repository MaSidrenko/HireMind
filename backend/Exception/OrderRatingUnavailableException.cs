namespace backend;

public class OrderRatingUnavailableException : AppException
{
	public OrderRatingUnavailableException()
		: base("Оценку можно выставить только после завершения заказа.", "order_rating_unavailable")
	{
	}

	public OrderRatingUnavailableException(string message, string code)
		: base(message, code)
	{
	}
}
