namespace backend;

public class DoneCriterion
{
	public int Id { get; set; }

	public int OrderId { get; set; }
	public Order Order { get; set; } = null!;

	public string Text { get; set; } = string.Empty;
	public bool Checked { get; set;} = false;
}
