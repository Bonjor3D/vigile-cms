namespace backend.Models;

public class Asset
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string Type { get; set; } = "image";
    public string Url { get; set; } = string.Empty;
    public long Size { get; set; }
    public string? Folder { get; set; }
    public string? Tags { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
