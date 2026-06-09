using System.Security.Claims;
using backend;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
namespace MyApp.Namespace
{
    /// <summary>
    /// Auth controller for handling authentication requests.
    /// </summary>
    [Route("api/v1/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly JwtOptions _jwtOptions;
        private readonly IAuthService _authService;
        public AuthController(
            IOptions<JwtOptions> jwtOptions,
            IAuthService authService
            )
        {
            _jwtOptions = jwtOptions.Value;
            _authService = authService;
        }
        
        [HttpPost("sign-up")]
        public async Task<IActionResult> SignUp([FromBody] CreateUserRequest request, CancellationToken ct, [FromServices] IEmailSender sender)
        {
            SignUpResult? result = await _authService.SignUpAsync(request,sender, ct);
              if(!result.IsSuccess)
            {
                return Conflict(
                    new
                    {
                        message = result.ErrorMessage
                    });
            }


            return Ok(new
            {
                message = "Пользователь зарегистрирован. Код подтверждения отправлен на email."
            });
        }
        [HttpPost("sign-in")]
        public async Task<IActionResult> SignIn([FromBody] LoginRequest request, CancellationToken ct)
        {
            AuthResult? result = await _authService.SignInAsync(request, ct);

            if(!result.IsSuccess)
            {
                return Unauthorized(new
                {
                    message = result.ErrorMessage
                });
            }

            AppendAccessTokenCookie(result.AccessToken!, result.ExpiresAtUtc);

            return Ok(new
            {
               user = result.User
            });
        }

        [HttpPost("email-verify")]
        public async Task<IActionResult> VerifyEmail(VerifyEmailRequest request, CancellationToken ct)
        {
            EmailVerifyResult? result = await _authService.VerifyEmailAsync(request, ct);
            if(result.ErrorMessage == "Email уже подтвержден")
            {
                return Ok(new
                {
                    message = result.ErrorMessage
                });
            }

            if(!result.IsSuccess)
            {
                return BadRequest(result.ErrorMessage);
            }

            return Ok(new
            {
                message = "Email успешно подтвержден"
            });
        }
        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> SignOut(CancellationToken ct)
        {
            string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if(!int.TryParse(userId, out int parsedUserId))
            {
               return Unauthorized();
            }

            await _authService.SignOutAsnyc(parsedUserId, ct);

            Response.Cookies.Delete(
                _jwtOptions.CookieName,
                new CookieOptions
                {
                    HttpOnly = true,
                    Secure = _jwtOptions.CookieSecure,
                    SameSite = ParseSameSiteMode(_jwtOptions.CookieSameSite),
                    Path = "/"
                }
            );

            return Ok(new
            {
               message = "Signed out successfully." 
            });
        }
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me(CancellationToken ct)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if(!int.TryParse(userId, out var parsedUserId))
            {
                return Unauthorized();
            }

            UserResult result = await _authService.Me(parsedUserId, ct);

            if(!result.IsSuccess)
            {
                return Unauthorized(new
                {
                    message = result.ErrorMessage
                });
            }

            return Ok(new
            {
                user = result.User
            });
        }
        [HttpPost("recovery-password")]
        public async Task<IActionResult> RecoveryPasswordRequest([FromBody] RecoveryPasswordRequest request, [FromServices] IEmailSender emailSender, CancellationToken ct = default)
        {
            RequestPasswordResetResult? result = await _authService.RequestPasswordResetAsync(request, emailSender, ct);

            if(!result.IsSuccess)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = result.Message
                });
            }

            return Ok(new 
            {
               message = result.Message
            });
        }
        private void AppendAccessTokenCookie(string accessToken, DateTime expiresAtUtc)
        {
            Response.Cookies.Append(
                _jwtOptions.CookieName,
                accessToken,
                new CookieOptions
                {
                    HttpOnly = true,
                    Secure = _jwtOptions.CookieSecure,
                    SameSite = ParseSameSiteMode(_jwtOptions.CookieSameSite),
                    Expires = expiresAtUtc,
                    Path = "/"
                }
            );
        }

        private static SameSiteMode ParseSameSiteMode(string value)
        {
            return value.Trim().ToLowerInvariant() switch
            {
                "strict" => SameSiteMode.Strict,
                "lax" => SameSiteMode.Lax,
                "none" => SameSiteMode.None,
                _ => SameSiteMode.Lax
            };
        }
    }
}
