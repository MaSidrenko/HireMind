namespace backend;

public class NullCompanyException : AppException
{
	public NullCompanyException() : base("Введите название компании", "null_company")
	{
		
	}
	public NullCompanyException(string message, string code) : base(message, code)
	{
	}
}
