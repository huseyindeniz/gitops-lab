using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace mySampleApp1.weatherForecast.Infra
{
    public class ApplicationDbContext : DbContext
    {

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { 
        
        
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

            // Seed data using extension method
            // modelBuilder.SeedInitialData();

        }
    }
}
