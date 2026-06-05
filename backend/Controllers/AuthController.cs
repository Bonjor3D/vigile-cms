using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Authentication;
using backend.Database;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtService _jwt;

    public AuthController(AppDbContext db, JwtService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Login == request.Login);

        if (user == null)
        {
            user = new User
            {
                Login = request.Login,
                PasswordHash = PasswordHasher.Hash(request.Password),
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
        }
        else
        {
            if (!PasswordHasher.Verify(request.Password, user.PasswordHash))
                return Unauthorized(new { error = "Invalid password" });
        }

        var accessToken = _jwt.GenerateAccessToken(user);
        var refreshToken = _jwt.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpires = DateTime.UtcNow.AddDays(request.RememberMe ? 30 : 1);
        await _db.SaveChangesAsync();

        Response.Cookies.Append("refreshToken", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = false,
            SameSite = SameSiteMode.Lax,
            MaxAge = request.RememberMe ? TimeSpan.FromDays(30) : TimeSpan.FromDays(1),
        });

        return Ok(new
        {
            user = new { user.Id, user.Login, user.CreatedAt },
            token = accessToken,
        });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        Response.Cookies.Delete("refreshToken");
        return Ok(new { message = "Logged out" });
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var token = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(token))
            return Unauthorized();

        var user = await _db.Users.FirstOrDefaultAsync(u => u.RefreshToken == token);
        if (user == null || user.RefreshTokenExpires < DateTime.UtcNow)
            return Unauthorized();

        var accessToken = _jwt.GenerateAccessToken(user);
        return Ok(new
        {
            user = new { user.Id, user.Login, user.CreatedAt },
            token = accessToken,
        });
    }
}

public record LoginRequest(string Login, string Password, bool RememberMe = false);
