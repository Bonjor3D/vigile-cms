using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/files")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly IWebHostEnvironment _env;

    public FilesController(IWebHostEnvironment env)
    {
        _env = env;
    }

    private string ResolvePath(string? relativePath)
    {
        var root = Path.Combine(_env.ContentRootPath, "Storage");
        Directory.CreateDirectory(root);

        var safe = (relativePath ?? "").Replace("..", "").TrimStart('/').TrimStart('\\');
        var full = Path.GetFullPath(Path.Combine(root, safe));

        if (!full.StartsWith(Path.GetFullPath(root), StringComparison.OrdinalIgnoreCase))
            throw new UnauthorizedAccessException("Path traversal detected");

        return full;
    }

    [HttpGet]
    public IActionResult List([FromQuery] string? path)
    {
        var dir = ResolvePath(path);
        if (!Directory.Exists(dir))
            return NotFound(new { error = "Directory not found" });

        var entries = new List<object>();

        foreach (var d in Directory.GetDirectories(dir))
        {
            var info = new DirectoryInfo(d);
            entries.Add(new
            {
                name = info.Name,
                path = GetRelativePath(info.FullName),
                type = "folder",
                modifiedAt = info.LastWriteTime,
            });
        }

        foreach (var f in Directory.GetFiles(dir))
        {
            var info = new FileInfo(f);
            entries.Add(new
            {
                name = info.Name,
                path = GetRelativePath(info.FullName),
                type = GetFileType(info.Extension),
                size = info.Length,
                modifiedAt = info.LastWriteTime,
            });
        }

        return Ok(new
        {
            currentPath = path ?? "",
            parentPath = GetParentPath(path),
            entries,
        });
    }

    [HttpGet("content")]
    public IActionResult GetContent([FromQuery] string? path)
    {
        var file = ResolvePath(path);
        if (!System.IO.File.Exists(file))
            return NotFound(new { error = "File not found" });

        var ext = Path.GetExtension(file).ToLowerInvariant();
        var textExts = new[] { ".txt", ".md", ".html", ".css", ".js", ".json", ".xml", ".csv", ".env", ".yml", ".yaml", ".cfg", ".conf", ".ini", ".log", ".sh", ".bat", ".ps1" };

        if (textExts.Contains(ext))
        {
            var content = System.IO.File.ReadAllText(file);
            return Ok(new { content, type = "text" });
        }

        var relative = GetRelativePath(file);
        var url = $"/storage/{relative.Replace("\\", "/")}";
        return Ok(new { url, type = "binary" });
    }

    [HttpPost("folder")]
    public IActionResult CreateFolder([FromQuery] string? path, [FromQuery] string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { error = "Folder name required" });

        var parent = ResolvePath(path);
        var dir = Path.Combine(parent, name);

        if (Directory.Exists(dir))
            return Conflict(new { error = "Folder already exists" });

        Directory.CreateDirectory(dir);
        return Ok(new { message = "Folder created", path = GetRelativePath(dir) });
    }

    [HttpPost("file")]
    public IActionResult CreateFile([FromQuery] string? path, [FromQuery] string name, [FromBody] CreateFileBody? body)
    {
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { error = "File name required" });

        var parent = ResolvePath(path);
        var file = Path.Combine(parent, name);

        if (System.IO.File.Exists(file))
            return Conflict(new { error = "File already exists" });

        System.IO.File.WriteAllText(file, body?.content ?? "");
        return Ok(new { message = "File created", path = GetRelativePath(file) });
    }

    [HttpPost("upload")]
    [RequestSizeLimit(100_000_000)]
    public async Task<IActionResult> Upload([FromQuery] string? path, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided" });

        var dir = ResolvePath(path);
        Directory.CreateDirectory(dir);

        var filePath = Path.Combine(dir, file.FileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return Ok(new { message = "File uploaded", path = GetRelativePath(filePath) });
    }

    [HttpDelete]
    public IActionResult Delete([FromQuery] string? path)
    {
        var full = ResolvePath(path);

        if (Directory.Exists(full))
        {
            Directory.Delete(full, true);
            return Ok(new { message = "Folder deleted" });
        }

        if (System.IO.File.Exists(full))
        {
            System.IO.File.Delete(full);
            return Ok(new { message = "File deleted" });
        }

        return NotFound(new { error = "Path not found" });
    }

    [HttpPost("copy")]
    public IActionResult Copy([FromBody] CopyMoveBody body)
    {
        var source = ResolvePath(body.from);
        var dest = ResolvePath(body.to);

        if (Directory.Exists(source))
        {
            CopyDirectory(source, dest);
            return Ok(new { message = "Folder copied" });
        }

        if (System.IO.File.Exists(source))
        {
            var destDir = Path.GetDirectoryName(dest)!;
            Directory.CreateDirectory(destDir);
            System.IO.File.Copy(source, dest, true);
            return Ok(new { message = "File copied" });
        }

        return NotFound(new { error = "Source not found" });
    }

    [HttpPost("move")]
    public IActionResult Move([FromBody] CopyMoveBody body)
    {
        var source = ResolvePath(body.from);
        var dest = ResolvePath(body.to);

        if (Directory.Exists(source))
        {
            Directory.Move(source, dest);
            return Ok(new { message = "Folder moved" });
        }

        if (System.IO.File.Exists(source))
        {
            var destDir = Path.GetDirectoryName(dest)!;
            Directory.CreateDirectory(destDir);
            System.IO.File.Move(source, dest, true);
            return Ok(new { message = "File moved" });
        }

        return NotFound(new { error = "Source not found" });
    }

    private string GetRelativePath(string fullPath)
    {
        var root = Path.GetFullPath(Path.Combine(_env.ContentRootPath, "Storage"));
        var relative = fullPath.Substring(root.Length).TrimStart('\\', '/');
        return relative.Replace("\\", "/");
    }

    private string? GetParentPath(string? path)
    {
        if (string.IsNullOrEmpty(path)) return null;
        var parent = Path.GetDirectoryName(path.TrimEnd('/'));
        return string.IsNullOrEmpty(parent) ? null : parent.Replace("\\", "/");
    }

    private static string GetFileType(string extension)
    {
        var imageExts = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".ico" };
        var videoExts = new[] { ".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv" };
        var audioExts = new[] { ".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a" };
        var codeExts = new[] { ".html", ".css", ".js", ".ts", ".jsx", ".tsx", ".json", ".xml", ".cs", ".py", ".rb", ".go", ".rs", ".java", ".php", ".sql", ".sh", ".bat", ".ps1", ".yaml", ".yml", ".md", ".txt", ".cfg", ".conf", ".env" };
        var ext = extension.ToLowerInvariant();

        if (imageExts.Contains(ext)) return "image";
        if (videoExts.Contains(ext)) return "video";
        if (audioExts.Contains(ext)) return "audio";
        if (codeExts.Contains(ext)) return "code";
        return "file";
    }

    private static void CopyDirectory(string source, string dest)
    {
        Directory.CreateDirectory(dest);
        foreach (var file in Directory.GetFiles(source))
        {
            var destFile = Path.Combine(dest, Path.GetFileName(file));
            System.IO.File.Copy(file, destFile, true);
        }
        foreach (var dir in Directory.GetDirectories(source))
        {
            var destDir = Path.Combine(dest, Path.GetFileName(dir));
            CopyDirectory(dir, destDir);
        }
    }

    public record CreateFileBody(string? content);
    public record CopyMoveBody(string from, string to);
}
