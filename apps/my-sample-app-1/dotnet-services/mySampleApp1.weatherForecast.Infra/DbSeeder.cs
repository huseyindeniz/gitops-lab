using Microsoft.EntityFrameworkCore;
using mySampleApp1.weatherForecast.Domain.Entities;

namespace mySampleApp1.weatherForecast.Infra
{
    public static class DbSeeder
    {
        public static void SeedInitialData(this ModelBuilder modelBuilder)
        {
            // add initial db data here by using modelBuilder.Entity<EntityName>().HasData
            // do not use dynamic column values
            // otherwise ef core thinks that entity records has changed and it'll try to insert new records in next migration

        }

    }
}
