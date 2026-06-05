using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Database;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/settings")]
public class SiteSettingsController : ControllerBase
{
    private readonly AppDbContext _db;

    private static readonly string DefaultHeaderJson = """{"id":"__default_header__","type":"div","tag":"header","styles":{"padding":"12px 24px","backgroundColor":"#1f2937","color":"#ffffff","display":"flex","alignItems":"center","justifyContent":"space-between"},"children":[{"id":"__default_header_logo__","type":"span","tag":"span","text":"My Site","styles":{"fontSize":"20px","fontWeight":"700"}},{"id":"__default_header_nav__","type":"nav","tag":"nav","styles":{"display":"flex","gap":"16px"},"children":[{"id":"__default_header_home__","type":"span","tag":"span","text":"Home","styles":{"color":"#d1d5db","cursor":"pointer"}},{"id":"__default_header_about__","type":"span","tag":"span","text":"About","styles":{"color":"#d1d5db","cursor":"pointer"}}]}]}""";

    private static readonly string DefaultFooterJson = """{"id":"__default_footer__","type":"div","tag":"footer","styles":{"padding":"24px","backgroundColor":"#f9fafb","textAlign":"center","color":"#6b7280","fontSize":"14px"},"children":[{"id":"__default_footer_text__","type":"small","tag":"small","text":"© Powered by Vigile CMS"}]}""";

    public SiteSettingsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var settings = await _db.SiteSettings.FirstOrDefaultAsync();

        if (settings == null)
        {
            var uid = await _db.Users.Select(u => u.Id).FirstOrDefaultAsync();
            if (uid == Guid.Empty)
            {
                return Ok(new
                {
                    Id = (string?)null, Name = "My Site", Description = (string?)null,
                    Favicon = (string?)null, GlobalCss = (string?)null, GlobalJs = (string?)null,
                    ThemeVariables = (string?)null,
                    Header = JsonNode.Parse(DefaultHeaderJson),
                    Footer = JsonNode.Parse(DefaultFooterJson),
                });
            }
            settings = new SiteSettings { UserId = uid, Header = DefaultHeaderJson, Footer = DefaultFooterJson };
            _db.SiteSettings.Add(settings);
            await _db.SaveChangesAsync();
        }

        return Ok(new
        {
            settings.Id, settings.Name, settings.Description,
            settings.Favicon, settings.GlobalCss, settings.GlobalJs,
            settings.ThemeVariables,
            Header = settings.Header != null ? JsonNode.Parse(settings.Header) : JsonNode.Parse(DefaultHeaderJson),
            Footer = settings.Footer != null ? JsonNode.Parse(settings.Footer) : JsonNode.Parse(DefaultFooterJson),
        });
    }

    [HttpPut]
    [Authorize]
    public async Task<IActionResult> Update([FromBody] SiteSettingsUpdate request)
    {
        var settings = await _db.SiteSettings.FirstOrDefaultAsync();

        if (settings == null)
        {
            var uid = await _db.Users.Select(u => u.Id).FirstOrDefaultAsync();
            if (uid == Guid.Empty)
                uid = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            settings = new SiteSettings { UserId = uid, Header = DefaultHeaderJson, Footer = DefaultFooterJson };
            _db.SiteSettings.Add(settings);
        }

        if (request.Name != null) settings.Name = request.Name;
        if (request.Description != null) settings.Description = request.Description;
        if (request.Favicon != null) settings.Favicon = request.Favicon;
        if (request.GlobalCss != null) settings.GlobalCss = request.GlobalCss;
        if (request.GlobalJs != null) settings.GlobalJs = request.GlobalJs;
        if (request.Header != null) settings.Header = request.Header;
        if (request.Footer != null) settings.Footer = request.Footer;
        if (request.ThemeVariables != null) settings.ThemeVariables = request.ThemeVariables;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Settings updated" });
    }
}

public record SiteSettingsUpdate(
    string? Name,
    string? Description,
    string? Favicon,
    string? GlobalCss,
    string? GlobalJs,
    string? Header,
    string? Footer,
    string? ThemeVariables
);
