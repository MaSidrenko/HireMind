namespace backend;

public interface IAuthService
{
	Task<AuthResult> SignInAsync(LoginRequest request, CancellationToken ct = default);
	Task<AuthResult> SignUpAsync(CreateUserRequest request, CancellationToken ct =default);
	Task SignOutAsnyc(int userId, CancellationToken ct = default);
	Task<UserResult> Me(int userId, CancellationToken ct = default);

}
