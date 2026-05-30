namespace backend;

public class ClarificationQuestionRequest
{
	public int id { get; set; }
	public string Question { get; set; } = string.Empty;
	public RiskLevel Importance { get; set; } = RiskLevel.medium;
	public string Answer { get; set; } = string.Empty;
	public List<string> Options { get; set; } = new();
}
