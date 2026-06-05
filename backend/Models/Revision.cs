namespace backend.Models;

public class Revision
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PageId { get; set; }
    public string Snapshot { get; set; } = "{}";
    public string? Message { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Page Page { get; set; } = null!;
}
