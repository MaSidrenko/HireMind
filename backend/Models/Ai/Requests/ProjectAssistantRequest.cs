namespace backend;

public class ProjectAssistantRequest
{
	public int ProjectId { get; set; }
	public string Prompt { get; set; } = string.Empty;
}
