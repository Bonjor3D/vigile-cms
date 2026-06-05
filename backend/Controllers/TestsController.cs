using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Database;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/tests")]
public class TestsController : ControllerBase
{
    private readonly ContentDbContext _db;

    public TestsController(ContentDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tests = await _db.Tests
            .OrderByDescending(t => t.UpdatedAt)
            .Select(t => new
            {
                t.Id,
                t.Title,
                t.Description,
                t.PassingScore,
                t.CreatedAt,
                t.UpdatedAt,
            })
            .ToListAsync();

        return Ok(tests);
    }

    [HttpGet("{idOrTitle}")]
    public async Task<IActionResult> GetById(string idOrTitle)
    {
        Test? test;

        if (Guid.TryParse(idOrTitle, out var guid))
        {
            test = await _db.Tests.FindAsync(guid);
        }
        else
        {
            test = await _db.Tests.FirstOrDefaultAsync(t => t.Title == idOrTitle);
        }

        if (test == null) return NotFound();

        return Ok(new
        {
            test.Id,
            test.Title,
            test.Description,
            test.TimeLimit,
            test.PassingScore,
            test.ShuffleQuestions,
            Questions = JsonDocument.Parse(test.Questions),
            test.CreatedAt,
            test.UpdatedAt,
        });
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] JsonElement body)
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

        var test = new Test
        {
            UserId = userId,
            Title = body.GetProperty("title").GetString() ?? "Untitled",
            Description = body.TryGetProperty("description", out var desc) ? desc.GetString() : null,
            Questions = "[]",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.Tests.Add(test);
        await _db.SaveChangesAsync();

        return Ok(new { test.Id, test.Title, test.CreatedAt });
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(Guid id, [FromBody] JsonElement body)
    {
        var test = await _db.Tests.FindAsync(id);
        if (test == null) return NotFound();

        if (body.TryGetProperty("title", out var title))
            test.Title = title.GetString() ?? test.Title;

        if (body.TryGetProperty("description", out var desc))
            test.Description = desc.GetString();

        if (body.TryGetProperty("timeLimit", out var timeLimit))
            test.TimeLimit = timeLimit.ValueKind == JsonValueKind.Null ? null : timeLimit.GetInt32();

        if (body.TryGetProperty("passingScore", out var passingScore))
            test.PassingScore = passingScore.GetDouble();

        if (body.TryGetProperty("shuffleQuestions", out var shuffle))
            test.ShuffleQuestions = shuffle.GetBoolean();

        if (body.TryGetProperty("questions", out var questions))
            test.Questions = questions.GetRawText();

        test.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Test updated" });
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id)
    {
        var test = await _db.Tests.FindAsync(id);
        if (test == null) return NotFound();

        _db.Tests.Remove(test);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Test deleted" });
    }

    [HttpPost("{idOrTitle}/submit")]
    public async Task<IActionResult> Submit(string idOrTitle, [FromBody] JsonElement body)
    {
        Test? test;

        if (Guid.TryParse(idOrTitle, out var guid))
        {
            test = await _db.Tests.FindAsync(guid);
        }
        else
        {
            test = await _db.Tests.FirstOrDefaultAsync(t => t.Title == idOrTitle);
        }

        if (test == null) return NotFound();

        var questions = JsonSerializer.Deserialize<List<JsonElement>>(test.Questions) ?? [];

        var attempt = new TestAttempt
        {
            TestId = test.Id,
            Group = body.GetProperty("group").GetString() ?? "",
            FirstName = body.GetProperty("firstName").GetString() ?? "",
            LastName = body.GetProperty("lastName").GetString() ?? "",
            Answers = body.GetProperty("answers").GetRawText(),
            TabSwitchCount = body.TryGetProperty("tabSwitchCount", out var tsc) ? tsc.GetInt32() : 0,
            StartedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow,
        };

        double score = 0;
        double maxScore = 0;
        int correctCount = 0;
        int failedCount = 0;
        int skippedCount = 0;

        var answers = JsonSerializer.Deserialize<List<JsonElement>>(attempt.Answers) ?? [];

        foreach (var question in questions)
        {
            var qId = question.GetProperty("id").GetString();
            var points = question.GetProperty("points").ValueKind == JsonValueKind.Null ? 1 : question.GetProperty("points").GetDouble();
            var correctIds = new HashSet<string>();

            if (question.TryGetProperty("options", out var options))
            {
                foreach (var opt in options.EnumerateArray())
                {
                    if (opt.GetProperty("correct").GetBoolean())
                        correctIds.Add(opt.GetProperty("id").GetString()!);
                }
            }

            maxScore += points;

            var answerEl = answers.FirstOrDefault(a => a.GetProperty("questionId").GetString() == qId);
            if (answerEl.ValueKind == JsonValueKind.Undefined)
            {
                skippedCount++;
                continue;
            }

            var selected = answerEl.GetProperty("selectedIds").EnumerateArray().Select(s => s.GetString()!).Where(s => s != null).ToHashSet();

            // Single type: must match exactly
            var qType = question.TryGetProperty("type", out var qt) ? qt.GetString() : "single";

            if (qType == "single")
            {
                if (selected.SetEquals(correctIds))
                {
                    score += points;
                    correctCount++;
                }
                else
                {
                    failedCount++;
                }
            }
            else
            {
                var scoringMode = question.TryGetProperty("scoringMode", out var sm) ? sm.GetString() : "all";
                var correctSelected = selected.Count(s => correctIds.Contains(s));
                var incorrectSelected = selected.Count(s => !correctIds.Contains(s));

                if (scoringMode == "partial")
                {
                    if (correctSelected > 0)
                    {
                        var fraction = (double)correctSelected / correctIds.Count;
                        score += points * fraction;
                        correctCount++;
                    }
                    else if (selected.Count == 0)
                    {
                        skippedCount++;
                    }
                    else
                    {
                        failedCount++;
                    }
                }
                else if (scoringMode == "subtractive")
                {
                    if (correctSelected > 0)
                    {
                        var net = Math.Max(0, correctSelected - incorrectSelected);
                        var fraction = (double)net / correctIds.Count;
                        score += points * fraction;
                        correctCount++;
                    }
                    else
                    {
                        failedCount++;
                    }
                }
                else // "all" (default)
                {
                    if (selected.SetEquals(correctIds))
                    {
                        score += points;
                        correctCount++;
                    }
                    else
                    {
                        failedCount++;
                    }
                }
            }
        }

        attempt.Score = score;
        attempt.MaxScore = maxScore;
        attempt.CorrectCount = correctCount;
        attempt.FailedCount = failedCount;
        attempt.SkippedCount = skippedCount;

        _db.TestAttempts.Add(attempt);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            attempt.Id,
            attempt.Score,
            attempt.MaxScore,
            attempt.CorrectCount,
            attempt.FailedCount,
            attempt.SkippedCount,
            attempt.TabSwitchCount,
            Percentage = maxScore > 0 ? (score / maxScore * 100) : 0,
            Passed = maxScore > 0 && (score / maxScore * 100) >= test.PassingScore,
        });
    }

    [HttpGet("{id}/attempts")]
    [Authorize]
    public async Task<IActionResult> GetAttempts(Guid id)
    {
        var attempts = await _db.TestAttempts
            .Where(a => a.TestId == id)
            .OrderByDescending(a => a.CompletedAt)
            .Select(a => new
            {
                a.Id,
                a.Group,
                a.FirstName,
                a.LastName,
                a.Score,
                a.MaxScore,
                a.CorrectCount,
                a.FailedCount,
                a.SkippedCount,
                a.TabSwitchCount,
                a.StartedAt,
                a.CompletedAt,
            })
            .ToListAsync();

        return Ok(attempts);
    }

    [HttpGet("{id}/attempts/{attemptId}")]
    [Authorize]
    public async Task<IActionResult> GetAttemptDetail(Guid id, Guid attemptId)
    {
        var attempt = await _db.TestAttempts
            .Where(a => a.TestId == id && a.Id == attemptId)
            .FirstOrDefaultAsync();

        if (attempt == null) return NotFound();

        var test = await _db.Tests.FindAsync(id);

        return Ok(new
        {
            attempt.Id,
            attempt.Group,
            attempt.FirstName,
            attempt.LastName,
            attempt.Score,
            attempt.MaxScore,
            attempt.CorrectCount,
            attempt.FailedCount,
            attempt.SkippedCount,
            attempt.TabSwitchCount,
            attempt.StartedAt,
            attempt.CompletedAt,
            Answers = JsonDocument.Parse(attempt.Answers),
            Questions = test != null ? JsonDocument.Parse(test.Questions) : null,
        });
    }

    [HttpDelete("{id}/attempts/{attemptId}")]
    [Authorize]
    public async Task<IActionResult> DeleteAttempt(Guid id, Guid attemptId)
    {
        var attempt = await _db.TestAttempts
            .Where(a => a.TestId == id && a.Id == attemptId)
            .FirstOrDefaultAsync();

        if (attempt == null) return NotFound();

        _db.TestAttempts.Remove(attempt);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Attempt deleted" });
    }
}
