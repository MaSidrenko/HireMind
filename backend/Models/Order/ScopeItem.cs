namespace backend;

public class ScopeItem
{
	public int Id { get; set; }
	
	public int OrderId { get; set; }
	public Order Order { get; set; } = null!;

	public string Title { get; set; } = string.Empty;
	public string Description { get; set; } = string.Empty;

	public ScopeBucket Bucket { get; set; } = ScopeBucket.included;
}
