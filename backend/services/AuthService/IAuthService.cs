namespace backend;

public interface IAuthService
{
	Task<AuthResult> SignInAsync(LoginRequest request, CancellationToken ct = default);
	Task<SignUpResult> SignUpAsync(CreateUserRequest request, IEmailSender emailSender, CancellationToken ct =default);
	Task SignOutAsnyc(int userId, CancellationToken ct = default);
	Task<UserResult> Me(int userId, CancellationToken ct = default);
	Task<EmailVerifyResult> VerifyEmailAsync(VerifyEmailRequest request, CancellationToken ct = default);
}
