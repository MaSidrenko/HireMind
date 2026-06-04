namespace backend;

public class AiBriefResult
{
	public string Summary { get; set; } = string.Empty;
	public BriefSectionsDto BriefSections { get; set; } = new();
	public List<ClarificationQuestionDto> Questions { get; set; } = new();
	public List<ScopeItemDto> ScopeItems { get; set; } = new();
	public List<DoneCriterionDto> DoneCriteria { get; set; } = new();
	public List<RiskItemDto> Risks { get; set; } = new();
}
