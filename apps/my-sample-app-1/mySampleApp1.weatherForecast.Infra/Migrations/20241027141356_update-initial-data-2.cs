using Microsoft.EntityFrameworkCore.Migrations;
using mySampleApp1.weatherForecast.Domain.Entities;

#nullable disable

namespace mySampleApp1.weatherForecast.Infra.Migrations
{
    /// <inheritdoc />
    public partial class updateinitialdata2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            string[] Summaries = new[]{
                "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
            };

            int batchSize = 1000; // Define batch size for insertion
            int totalRecords = 5000000;
            int batches = totalRecords / batchSize;
            int dateRangeDays = 365 * 10; // Limit to past 10 years

            for (int batch = 0; batch < batches; batch++)
            {
                // Initialize a batch in the `new object[,]` format
                var records = new object[batchSize, 4];

                for (int i = 0; i < batchSize; i++)
                {
                    int index = batch * batchSize + i + 1;
                    records[i, 0] = index;
                    records[i, 1] = DateOnly.FromDateTime(DateTime.Now.AddDays(index % dateRangeDays));
                    records[i, 2] = Summaries[Random.Shared.Next(Summaries.Length)];
                    records[i, 3] = Random.Shared.Next(-20, 55);
                }

                migrationBuilder.InsertData(
                    table: "WeatherForecasts",
                    columns: new[] { "Id", "Date", "Summary", "TemperatureC" },
                    values: records
                );
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM WeatherForecasts WHERE Id BETWEEN 1 AND 5000000");
        }
    }
}
