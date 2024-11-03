using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace mySampleApp1.weatherForecast.Infra.Migrations
{
    /// <inheritdoc />
    public partial class longrunningmigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("SELECT pg_sleep(540);"); // run for 9 mins
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
