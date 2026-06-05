using System.Text.Json;

namespace backend.Models;

public class Page
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Title { get; set; } = "Untitled";
    public string Slug { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string Visibility { get; set; } = "published";
    public Guid? ParentId { get; set; }
    public int SortOrder { get; set; }
    public string Root { get; set; } = """{"id":"root","type":"div","tag":"div","children":[]}""";
    public Guid? TemplateId { get; set; }
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public string? SeoKeywords { get; set; }
    public string? SeoOgImage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Page? Parent { get; set; }
    public List<Page> Children { get; set; } = [];
    public List<Revision> Revisions { get; set; } = [];
}
