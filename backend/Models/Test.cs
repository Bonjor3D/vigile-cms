using System.Text.Json;

namespace backend.Models;

public class Test
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Title { get; set; } = "Untitled";
    public string? Description { get; set; }
    public int? TimeLimit { get; set; }
    public double PassingScore { get; set; } = 80;
    public bool ShuffleQuestions { get; set; }
    public string Questions { get; set; } = "[]";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<TestAttempt> Attempts { get; set; } = [];
}
