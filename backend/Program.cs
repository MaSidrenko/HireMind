using System.Data.Common;
using System.Text;
using System.Text.Json.Serialization;
using backend;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Npgsql;

Env.TraversePath().Load();


var builder = WebApplication.CreateBuilder(args);

// if(builder.Environment.IsDevelopment())
// {
//     Env.Load();
// }


builder.Services.Configure<JwtOptions>(
    builder.Configuration.GetSection("Jwt")
);

var jwtOptions = builder.Configuration
        .GetSection("Jwt")
        .Get<JwtOptions>()
        ?? throw new InvalidOperationException("JWT options are missing.");

ValidateJwtOptions(jwtOptions);

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(
        new JsonStringEnumConverter(allowIntegerValues: false)
    );
});

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = true;
        options.SaveToken = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,

            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,

            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtOptions.Secret)
            ),

            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
            NameClaimType = System.Security.Claims.ClaimTypes.NameIdentifier
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var token = context.Request.Cookies[jwtOptions.CookieName];

                if (!string.IsNullOrWhiteSpace(token))
                {
                    context.Token = token;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

var connectionStringBuilder = new NpgsqlConnectionStringBuilder
{
    Host = Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost",
    Port = int.Parse(Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "5432"),
    Database = Environment.GetEnvironmentVariable("POSTGRES_DB") 
                ?? throw new InvalidOperationException("POSTGRES_DB is missing"),
    Username = Environment.GetEnvironmentVariable("POSTGRES_USER") 
                ?? throw new InvalidOperationException("POSTGRES_USER is missing"),
    Password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") 
                ?? throw new InvalidOperationException("POSTGRES_PASSWORD is missing")
};

builder.Services.AddDbContext<AppDbContext>(options => 
    options.UseNpgsql(connectionStringBuilder.ConnectionString));

builder.Services.AddScoped<IPasswordHashSerivce, Pbkdf2PasswordHashService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "HireMindAPI",
        Version = "v1",
        Description = "API для фриланс биржи HireMind"
    });
});


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();


app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

static void LoadDotEnv()
{
    var envPath = FindFileUpwards(".env");

    if (envPath is null)
        return;

    Env.NoClobber().Load(envPath);
}

static string? FindFileUpwards(string fileName)
{
    var directory = new DirectoryInfo(Directory.GetCurrentDirectory());

    while (directory is not null)
    {
        var filePath = Path.Combine(directory.FullName, fileName);

        if (File.Exists(filePath))
            return filePath;

        directory = directory.Parent;
    }

    return null;
}


static void ValidateJwtOptions(JwtOptions options)
{
     if (string.IsNullOrWhiteSpace(options.Issuer))
        throw new InvalidOperationException("JWT issuer is missing.");

    if (string.IsNullOrWhiteSpace(options.Audience))
        throw new InvalidOperationException("JWT audience is missing.");

    if (string.IsNullOrWhiteSpace(options.Secret))
        throw new InvalidOperationException("JWT secret is missing.");

    if (Encoding.UTF8.GetByteCount(options.Secret) < 32)
        throw new InvalidOperationException("JWT secret must be at least 32 bytes.");

    if (options.AccessTokenExpirationMinutes <= 0)
        throw new InvalidOperationException("JWT expiration must be greater than zero.");
}