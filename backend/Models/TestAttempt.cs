namespace backend.Models;

public class TestAttempt
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TestId { get; set; }
    public string Group { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Answers { get; set; } = "[]";
    public double Score { get; set; }
    public double MaxScore { get; set; }
    public int CorrectCount { get; set; }
    public int FailedCount { get; set; }
    public int SkippedCount { get; set; }
    public int TabSwitchCount { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    public Test? Test { get; set; }
}
