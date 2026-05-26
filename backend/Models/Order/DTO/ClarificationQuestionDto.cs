namespace backend;

public class ClarificationQuestionDto
{
	public int Id { get; set; }
	public string Question { get; set; } = string.Empty;
	public RiskLevel Importance { get; set; }
	public string Answer { get; set; } = string.Empty;
	public List<string> Options { get; set; } = new();
}
