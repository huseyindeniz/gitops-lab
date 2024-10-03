using Microsoft.EntityFrameworkCore;
using mySampleApp1.weatherForecast.Domain.Entities;

namespace mySampleApp1.weatherForecast.Infra
{
    public static class DbSeeder
    {
        public static readonly string[] Summaries = new[]
{
            "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
        };

        public static void SeedInitialData(this ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<WeatherForecast>().HasData(
                Enumerable
                    .Range(1, 5)
                    .Select(index =>
                        new WeatherForecast(
                            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                            Random.Shared.Next(-20, 55),
                            Summaries[Random.Shared.Next(Summaries.Length)]
                        )
                        {
                            Id = index // Set the Id explicitly
                        }
                    )
                    .ToList()
            );
        }

    }
}
