using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Database;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/assets")]
public class AssetsController : ControllerBase
{
    private readonly ContentDbContext _db;
    private readonly IWebHostEnvironment _env;

    public AssetsController(ContentDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAll()
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var assets = await _db.Assets
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new { a.Id, a.FileName, a.Type, a.Url, a.Size, a.Folder, a.CreatedAt })
            .ToListAsync();

        return Ok(assets);
    }

    [HttpPost("upload")]
    [Authorize]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided" });

        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

        var uploadsDir = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid()}_{file.FileName}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var asset = new Asset
        {
            UserId = userId,
            FileName = file.FileName,
            Type = file.ContentType.StartsWith("image") ? "image" : "document",
            Url = $"/uploads/{fileName}",
            Size = file.Length,
        };

        _db.Assets.Add(asset);
        await _db.SaveChangesAsync();

        return Ok(new { asset.Id, asset.FileName, asset.Type, asset.Url, asset.Size, asset.CreatedAt });
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id)
    {
        var asset = await _db.Assets.FindAsync(id);
        if (asset == null) return NotFound();

        var filePath = Path.Combine(_env.WebRootPath ?? "wwwroot", asset.Url.TrimStart('/'));
        if (System.IO.File.Exists(filePath))
            System.IO.File.Delete(filePath);

        _db.Assets.Remove(asset);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Asset deleted" });
    }
}
