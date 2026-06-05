using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using backend.Authentication;
using backend.Database;
using System.Text.Json.Serialization;
using backend.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });
builder.Services.AddOpenApi();

builder.Services.AddDbContext<AppDbContext>(options =>
{
    var dbPath = Path.Combine(builder.Environment.ContentRootPath, "vigile.db");
    options.UseSqlite($"Data Source={dbPath}");
});

builder.Services.AddDbContext<ContentDbContext>(options =>
{
    var dbPath = Path.Combine(builder.Environment.ContentRootPath, "content.db");
    options.UseSqlite($"Data Source={dbPath}");
});

builder.Services.AddSingleton<JwtService>();

var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "vigile-super-secret-key-min-32-chars-long!!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "vigile",
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "vigile",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
        };
    });

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();
app.UseStaticFiles();

var storagePath = Path.Combine(app.Environment.ContentRootPath, "Storage");
Directory.CreateDirectory(storagePath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(storagePath),
    RequestPath = "/storage",
});

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var appDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    appDb.Database.EnsureCreated();

    var contentDb = scope.ServiceProvider.GetRequiredService<ContentDbContext>();
    contentDb.Database.EnsureCreated();

    // One-time migration: add ThemeVariables column if missing
    try
    {
        using var cmd = appDb.Database.GetDbConnection().CreateCommand();
        cmd.CommandText = "SELECT COUNT(*) FROM pragma_table_info('SiteSettings') WHERE name = 'ThemeVariables'";
        if (cmd.Connection!.State != System.Data.ConnectionState.Open)
            await cmd.Connection.OpenAsync();
        var count = (long)(await cmd.ExecuteScalarAsync())!;
        if (count == 0)
        {
            appDb.Database.ExecuteSqlRaw("ALTER TABLE \"SiteSettings\" ADD COLUMN \"ThemeVariables\" TEXT NULL");
        }
    }
    catch
    {
        // Migration failed — column might already exist or table may be locked
    }

    // One-time migration: create Tests/TestAttempts tables if missing
    try
    {
        contentDb.Database.ExecuteSqlRaw("SELECT COUNT(*) FROM \"Tests\"");
    }
    catch
    {
        contentDb.Database.ExecuteSqlRaw(
            "CREATE TABLE \"Tests\" (" +
            "\"Id\" TEXT NOT NULL CONSTRAINT \"PK_Tests\" PRIMARY KEY," +
            "\"UserId\" TEXT NOT NULL," +
            "\"Title\" TEXT NOT NULL," +
            "\"Description\" TEXT NULL," +
            "\"TimeLimit\" INTEGER NULL," +
            "\"PassingScore\" REAL NOT NULL DEFAULT 80.0," +
            "\"ShuffleQuestions\" INTEGER NOT NULL DEFAULT 0," +
            "\"Questions\" TEXT NOT NULL DEFAULT '[]'," +
            "\"CreatedAt\" TEXT NOT NULL," +
            "\"UpdatedAt\" TEXT NOT NULL" +
            ");" +
            "CREATE TABLE \"TestAttempts\" (" +
            "\"Id\" TEXT NOT NULL CONSTRAINT \"PK_TestAttempts\" PRIMARY KEY," +
            "\"TestId\" TEXT NOT NULL," +
            "\"Group\" TEXT NOT NULL," +
            "\"FirstName\" TEXT NOT NULL," +
            "\"LastName\" TEXT NOT NULL," +
            "\"Answers\" TEXT NOT NULL DEFAULT '[]'," +
            "\"Score\" REAL NOT NULL DEFAULT 0.0," +
            "\"MaxScore\" REAL NOT NULL DEFAULT 0.0," +
            "\"CorrectCount\" INTEGER NOT NULL DEFAULT 0," +
            "\"FailedCount\" INTEGER NOT NULL DEFAULT 0," +
            "\"SkippedCount\" INTEGER NOT NULL DEFAULT 0," +
            "\"TabSwitchCount\" INTEGER NOT NULL DEFAULT 0," +
            "\"StartedAt\" TEXT NOT NULL," +
            "\"CompletedAt\" TEXT NULL," +
            "CONSTRAINT \"FK_TestAttempts_Tests_TestId\" FOREIGN KEY (\"TestId\") REFERENCES \"Tests\" (\"Id\") ON DELETE CASCADE" +
            ");"
        );
    }

}

app.Run();
