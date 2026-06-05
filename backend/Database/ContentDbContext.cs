using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Database;

public class ContentDbContext : DbContext
{
    public ContentDbContext(DbContextOptions<ContentDbContext> options) : base(options) { }

    public DbSet<Page> Pages => Set<Page>();
    public DbSet<Revision> Revisions => Set<Revision>();
    public DbSet<Asset> Assets => Set<Asset>();
    public DbSet<Template> Templates => Set<Template>();
    public DbSet<Test> Tests => Set<Test>();
    public DbSet<TestAttempt> TestAttempts => Set<TestAttempt>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Page>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.Slug);
            e.HasIndex(p => p.Endpoint);
            e.Property(p => p.Slug).HasMaxLength(128).IsRequired();
            e.Property(p => p.Endpoint).HasMaxLength(256);
            e.Property(p => p.Title).HasMaxLength(256);
            e.Property(p => p.Visibility).HasMaxLength(32);

            e.HasOne(p => p.Parent)
                .WithMany(p => p.Children)
                .HasForeignKey(p => p.ParentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Revision>(e =>
        {
            e.HasKey(r => r.Id);
            e.HasOne(r => r.Page)
                .WithMany(p => p.Revisions)
                .HasForeignKey(r => r.PageId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Asset>(e =>
        {
            e.HasKey(a => a.Id);
        });

        modelBuilder.Entity<Template>(e =>
        {
            e.HasKey(t => t.Id);
            e.Property(t => t.Type).HasMaxLength(32);
        });

        modelBuilder.Entity<Test>(e =>
        {
            e.HasKey(t => t.Id);
            e.Property(t => t.Title).HasMaxLength(256).IsRequired();
            e.Property(t => t.Questions).HasColumnType("text");
            e.HasMany(t => t.Attempts)
                .WithOne(a => a.Test)
                .HasForeignKey(a => a.TestId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TestAttempt>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Group).HasMaxLength(64);
            e.Property(a => a.FirstName).HasMaxLength(128);
            e.Property(a => a.LastName).HasMaxLength(128);
            e.Property(a => a.Answers).HasColumnType("text");
        });
    }
}
