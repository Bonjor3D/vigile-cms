using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Database;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<SiteSettings> SiteSettings => Set<SiteSettings>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Login).IsUnique();
            e.Property(u => u.Login).HasMaxLength(64).IsRequired();
            e.Property(u => u.PasswordHash).IsRequired();
        });

        modelBuilder.Entity<SiteSettings>(e =>
        {
            e.HasKey(s => s.Id);
            e.Property(s => s.UserId).HasColumnName("UserId");
        });
    }
}
