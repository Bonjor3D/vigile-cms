namespace backend.Models;

public class SiteSettings
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = "My Site";
    public string? Description { get; set; }
    public string? Favicon { get; set; }
    public string? GlobalCss { get; set; }
    public string? GlobalJs { get; set; }
    public string? Header { get; set; }
    public string? Footer { get; set; }
    public string? ThemeVariables { get; set; }
}
