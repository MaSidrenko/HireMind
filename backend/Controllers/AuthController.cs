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
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IPasswordHashSerivce _passwordHashSerivce;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly JwtOptions _jwtOptions;
        public AuthController(
            AppDbContext context, 
            IPasswordHashSerivce passwordHashSerivce,
            IJwtTokenService jwtTokenService,
            IOptions<JwtOptions> jwtOptions
            )
        {
            _db = context;
            _passwordHashSerivce = passwordHashSerivce;
            _jwtTokenService = jwtTokenService;
            _jwtOptions = jwtOptions.Value;
        }
        
        [HttpPost("sign-up")]
        public async Task<IActionResult> SignUp([FromBody] CreateUserRequest request)
        {
             if (string.IsNullOrWhiteSpace(request.FullName))
            {
                return BadRequest(new
                {
                    message = "Full name is required."
                });
            }

            var email = request.Email.Trim().ToLowerInvariant();

            bool emailAlreadyExists = await _db.Users.AnyAsync(user => user.Email == email);

            if(emailAlreadyExists)
            {
                return Conflict(
                    new
                    {
                        message = "User with this email already exists."
                    });
            }
            var passwordHashResult = _passwordHashSerivce.HashPassword(request.Password);
            User newUser = new()
            {
                Email = email,
                FullName = request.FullName,
                Role = request.Role,
                Contacts = request.Contacts,
                CompanyName = request.CompanyName,
                PasswordHash = passwordHashResult.Hash,
                Salt = passwordHashResult.Salt,
                CreatedAt = DateTime.UtcNow,
                LastSeenAt = DateTime.UtcNow
            };

            _db.Users.Add(newUser);
            await _db.SaveChangesAsync();

            var expiresAtUtc = DateTime.UtcNow.AddMinutes(
                _jwtOptions.AccessTokenExpirationMinutes
            );

            var accessToken = _jwtTokenService.GenerateAccessToken(
                newUser,
                expiresAtUtc
            );

            AppendAccessTokenCookie(accessToken, expiresAtUtc);

            return Ok(new
            {
                user = ToUserResponse(newUser)
            });
        }
        [HttpPost("sign-in")]
        public async Task<IActionResult> SignIn([FromBody] LoginRequest request)
        {
            var email = request.Email.Trim().ToLowerInvariant();

            var user = await _db.Users
                    .FirstOrDefaultAsync(user => user.Email == email);

            if(user is null)
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password. Please try again." 
                });
            }

            if(string.IsNullOrWhiteSpace(user.PasswordHash) || string.IsNullOrWhiteSpace(user.Salt))
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password. Please try again." 
                });
            }

            bool isValidPassword = _passwordHashSerivce.VerifyPassword(
                password: request.Password,
                storedHash: user.PasswordHash,
                storedSalt: user.Salt
            );

            if(!isValidPassword)
            {
                return Unauthorized(new
                {
                   message = "Invalid email or password. Please try again." 
                });
            }

            user.LastSeenAt = DateTime.UtcNow;
            user.IsOnline = true;

            await _db.SaveChangesAsync();

            var expiresAtUtc = DateTime.UtcNow.AddMinutes(
                _jwtOptions.AccessTokenExpirationMinutes
            );

            var accessToken = _jwtTokenService.GenerateAccessToken(
                user,
                expiresAtUtc
            );

            AppendAccessTokenCookie(accessToken, expiresAtUtc);

            return Ok(new
            {
               user = ToUserResponse(user) 
            });
        }
        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> SignOut()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if(int.TryParse(userId, out var parsedUserId))
            {
                var user = await _db.Users.FirstOrDefaultAsync(user => user.Id == parsedUserId);

                if(user is not null)
                {
                    user.IsOnline = false;
                    user.LastSeenAt = DateTime.UtcNow;

                    await _db.SaveChangesAsync();
                }
            }

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
        public async Task<IActionResult> Me()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if(!int.TryParse(userId, out var parsedUserId))
            {
                return Unauthorized();
            }

            var user = await _db.Users
                    .FirstOrDefaultAsync(user => user.Id == parsedUserId);

            if(user is null)
            {
                return Unauthorized();
            }

            return Ok(new
            {
                user = ToUserResponse(user)
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

        private static object ToUserResponse(User user)
        {
            return new
            {
                user.Id,
                user.Email,
                user.FullName,
                Role = user.Role.ToString(),
                user.Contacts,
                user.CompanyName,
                user.CreatedAt,
                user.LastSeenAt,
                user.IsOnline
            };
        }
    }
}
