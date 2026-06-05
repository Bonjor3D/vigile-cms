namespace backend.Models;

public class Template
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "page";
    public string Root { get; set; } = """{"id":"root","type":"div","tag":"div","children":[]}""";
    public string? Thumbnail { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
