using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace mySampleApp1.weatherForecast.Infra.Migrations
{
    /// <inheritdoc />
    public partial class addsourcetowf : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "WeatherForecasts",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Source",
                table: "WeatherForecasts");
        }
    }
}