namespace backend;

public class EmailMatchesCurrentException : AppException
{
	public EmailMatchesCurrentException()
		: base("Новый email совпадает с текущим", "email_matches_current")
	{
	}

	public EmailMatchesCurrentException(string message, string code = "email_matches_current")
		: base(message, code)
	{
	}
}
