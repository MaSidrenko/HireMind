namespace backend;
/// <summary>
/// Contacts User. Minimum required fields: telegram or phone. 
/// </summary>
public class Contacts
{
	/// <summary>
	/// Telegram contact of user.
	/// </summary>
	public string? Telegram { get; set; }
	/// <summary>
	/// Phone contact of user.
	/// </summary> 
	public string? Phone { get; set; }
}
