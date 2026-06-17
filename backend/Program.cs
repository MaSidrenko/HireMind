using System.Data.Common;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json.Serialization;
using backend;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Npgsql;
using Telegram.Bot;

Env.TraversePath().Load();


var builder = WebApplication.CreateBuilder(args);
string? groqApiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY");
string groqBaseUrl = Environment.GetEnvironmentVariable("GROQ_BASE_URL")
        ?? "https://api.groq.com/openai/v1/";
bool isAiEnabled = !string.IsNullOrWhiteSpace(groqApiKey);

Console.WriteLine($"GROQ_API_KEY loaded: {!string.IsNullOrWhiteSpace(groqApiKey)}");
Console.WriteLine($"GROQ_API_KEY length: {groqApiKey?.Length ?? 0}");

if (!string.IsNullOrWhiteSpace(groqApiKey))
{
    Console.WriteLine($"GROQ_API_KEY prefix: {groqApiKey[..Math.Min(4, groqApiKey.Length)]}");
    Console.WriteLine($"GROQ_API_KEY suffix: {groqApiKey[^Math.Min(4, groqApiKey.Length)..]}");
}

if (isAiEnabled)
{
	builder.Services.AddHttpClient("GroqAPI", httpClient =>
	{
		httpClient.BaseAddress = new Uri(groqBaseUrl);
		httpClient.DefaultRequestHeaders.Authorization =
			new AuthenticationHeaderValue("Bearer", groqApiKey);
	});
}

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

var telegramBotOptions = new TelegramBotOptions
{
    BotToken = ResolveTelegramSetting(
        builder.Configuration,
        "Telegram:BotToken",
        "Telegram:Bot_Token",
        "TELEGRAM_BOT_TOKEN",
        "Telegram__BotToken",
        "Telegram__Bot_Token"
    ) ?? string.Empty,
    BotUsername = ResolveTelegramSetting(
        builder.Configuration,
        "Telegram:BotUsername",
        "Telegram:Bot_Username",
        "TELEGRAM_BOT_USERNAME",
        "Telegram__BotUsername",
        "Telegram__Bot_Username"
    ) ?? string.Empty
};

builder.Services.AddDbContext<AppDbContext>(options => 
    options.UseNpgsql(connectionStringBuilder.ConnectionString));

builder.Services.AddScoped<IPasswordHashSerivce, Pbkdf2PasswordHashService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IProfileSerivce, ProfileSerivce>();
builder.Services.AddScoped<IFreelancerService, FreelancerService>();
builder.Services.AddScoped<ITelegramLinkService, TelegramLinkService>();
builder.Services.AddScoped<ITelegramNotificationService, NullTelegramNotificationService>();
builder.Services.AddScoped<IAdminService, AdminService>();

if (isAiEnabled)
{
	builder.Services.AddScoped<IAiService, AiService>();
}
else
{
	builder.Services.AddScoped<IAiService, NullAiService>();
}
builder.Services.AddSingleton(telegramBotOptions);

if (!string.IsNullOrWhiteSpace(telegramBotOptions.BotToken))
{
    builder.Services.AddHttpClient("TelegramBotApi", httpClient =>
    {
        httpClient.Timeout = TimeSpan.FromSeconds(45);
    });

    builder.Services.AddSingleton<ITelegramBotClient>(serviceProvider =>
    {
        IHttpClientFactory httpClientFactory = serviceProvider.GetRequiredService<IHttpClientFactory>();
        HttpClient httpClient = httpClientFactory.CreateClient("TelegramBotApi");

        return new TelegramBotClient(telegramBotOptions.BotToken, httpClient);
    });
    builder.Services.AddScoped<ITelegramNotificationService, TelegramNotificationService>();
    builder.Services.AddSingleton<TelegramUpdateHandler>();
    builder.Services.AddHostedService<TelegramPollingService>();
}

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

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

app.UseExceptionHandler();

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

static string? ResolveTelegramSetting(IConfiguration configuration, params string[] keys)
{
    foreach (string key in keys)
    {
        string? value = configuration[key];

        if (!string.IsNullOrWhiteSpace(value))
            return value;

        value = Environment.GetEnvironmentVariable(key);

        if (!string.IsNullOrWhiteSpace(value))
            return value;
    }

    return null;
}

public partial class Program { }
