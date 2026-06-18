namespace backend;

public class EmailChangeDeliveryFailedException : AppException
{
	public EmailChangeDeliveryFailedException()
		: base("Не удалось отправить код подтверждения. Попробуйте позже.", "email_change_delivery_failed")
	{
	}

	public EmailChangeDeliveryFailedException(string message, string code = "email_change_delivery_failed")
		: base(message, code)
	{
	}
}
