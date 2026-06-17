namespace backend;

public class EmailChangeWorkflowRequiredException : AppException
{
	public EmailChangeWorkflowRequiredException()
		: base("Для смены email используйте отдельный сценарий подтверждения.", "email_change_workflow_required")
	{
	}

	public EmailChangeWorkflowRequiredException(string message, string code = "email_change_workflow_required")
		: base(message, code)
	{
	}
}
