using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Database;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/pages")]
public class PagesController : ControllerBase
{
    private readonly ContentDbContext _db;

    public PagesController(ContentDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var pages = await _db.Pages
            .OrderBy(p => p.SortOrder)
            .Select(p => new
            {
                p.Id,
                p.Title,
                p.Slug,
                p.Endpoint,
                p.Icon,
                p.Visibility,
                p.ParentId,
                p.SortOrder,
                p.UpdatedAt,
                p.CreatedAt,
            })
            .ToListAsync();

        return Ok(pages);
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var page = await _db.Pages
            .Where(p => p.Slug == slug)
            .FirstOrDefaultAsync();

        if (page == null)
            return NotFound();

        return Ok(new
        {
            page.Id,
            page.Title,
            page.Slug,
            page.Endpoint,
            page.Icon,
            page.Visibility,
            page.ParentId,
            page.SortOrder,
            Root = JsonDocument.Parse(page.Root),
            page.SeoTitle,
            page.SeoDescription,
            page.SeoKeywords,
            page.SeoOgImage,
            page.CreatedAt,
            page.UpdatedAt,
        });
    }

    [HttpGet("by-endpoint/{**endpoint}")]
    public async Task<IActionResult> GetByEndpoint(string endpoint)
    {
        endpoint = endpoint.TrimEnd('/');
        if (string.IsNullOrEmpty(endpoint))
            endpoint = "index";

        var page = await _db.Pages
            .Where(p => p.Endpoint == endpoint)
            .FirstOrDefaultAsync();

        if (page == null)
            return NotFound();

        return Ok(new
        {
            page.Id,
            page.Title,
            page.Slug,
            page.Endpoint,
            page.Icon,
            page.Visibility,
            page.ParentId,
            page.SortOrder,
            Root = JsonDocument.Parse(page.Root),
            page.SeoTitle,
            page.SeoDescription,
            page.SeoKeywords,
            page.SeoOgImage,
            page.CreatedAt,
            page.UpdatedAt,
        });
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] JsonElement body)
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

        var slug = body.GetProperty("slug").GetString() ?? Guid.NewGuid().ToString();
        var endpoint = body.TryGetProperty("endpoint", out var ep) ? ep.GetString() ?? slug : slug;

        var page = new Page
        {
            UserId = userId,
            Title = body.GetProperty("title").GetString() ?? "Untitled",
            Slug = slug,
            Endpoint = endpoint,
            Visibility = "draft",
            Root = body.TryGetProperty("root", out var root) ? root.GetRawText() : """{"id":"root","type":"div","tag":"div","children":[]}""",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.Pages.Add(page);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            page.Id,
            page.Title,
            page.Slug,
            page.Endpoint,
            page.Visibility,
            page.CreatedAt,
            page.UpdatedAt,
        });
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(Guid id, [FromBody] JsonElement body)
    {
        var page = await _db.Pages.FindAsync(id);
        if (page == null) return NotFound();

        if (body.TryGetProperty("title", out var title))
            page.Title = title.GetString() ?? page.Title;

        if (body.TryGetProperty("endpoint", out var endpoint))
            page.Endpoint = endpoint.GetString() ?? page.Endpoint;

        if (body.TryGetProperty("visibility", out var visibility))
            page.Visibility = visibility.GetString() ?? page.Visibility;

        if (body.TryGetProperty("root", out var root))
            page.Root = root.GetRawText();

        if (body.TryGetProperty("parentId", out var parentId) && parentId.ValueKind == JsonValueKind.String)
            page.ParentId = Guid.Parse(parentId.GetString()!);

        page.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Create revision
        var revision = new Revision
        {
            PageId = page.Id,
            Snapshot = page.Root,
        };
        _db.Revisions.Add(revision);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Page updated" });
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id)
    {
        var page = await _db.Pages.FindAsync(id);
        if (page == null) return NotFound();

        _db.Pages.Remove(page);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Page deleted" });
    }

    [HttpGet("{id}/revisions")]
    public async Task<IActionResult> GetRevisions(Guid id)
    {
        var revisions = await _db.Revisions
            .Where(r => r.PageId == id)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new { r.Id, r.Message, r.CreatedAt })
            .ToListAsync();

        return Ok(revisions);
    }
}
