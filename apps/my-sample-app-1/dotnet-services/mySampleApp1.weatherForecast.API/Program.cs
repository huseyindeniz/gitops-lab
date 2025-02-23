
using System.Text;

using FluentValidation;
using FluentValidation.AspNetCore;

using Microsoft.EntityFrameworkCore;

using mySampleApp1.weatherForecast.API.Validators;
using mySampleApp1.weatherForecast.Domain.Interfaces;
using mySampleApp1.weatherForecast.Domain.Services;
using mySampleApp1.weatherForecast.Infra;
using mySampleApp1.weatherForecast.Infra.Repositories;

namespace mySampleApp1.weatherForecast.API
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            //builder.Configuration.AddEnvironmentVariables(prefix: "MyCustomPrefix_");

            var dbConf = builder.Configuration.GetSection("DB");
            var connStringBuilder = new StringBuilder();
            connStringBuilder.Append($"server={dbConf["HOST"]};");
            connStringBuilder.Append($"port={dbConf["PORT"]};");
            connStringBuilder.Append($"database={dbConf["NAME"]};");
            connStringBuilder.Append($"userid={dbConf["USER"]};");
            connStringBuilder.Append($"password={dbConf["PASSWORD"]};");
            var connString = connStringBuilder.ToString();
            Console.WriteLine(connString);

            // Register AutoMapper
            builder.Services.AddAutoMapper(config =>
            {
                // Scan and add all assemblies that match your application's naming convention
                var assemblies = AppDomain.CurrentDomain
                    .GetAssemblies()
                    .Where(assembly => assembly.GetName().Name.StartsWith("mySampleApp1"))
                    .ToArray();

                config.AddMaps(assemblies);
            });

            builder.Services.AddValidatorsFromAssemblyContaining<Program>(); // register validators
            builder.Services.AddFluentValidationAutoValidation(); // the same old MVC pipeline behavior
            builder.Services.AddFluentValidationClientsideAdapters();

            // Register ApplicationDbContext
            builder.Services.AddDbContextPool<ApplicationDbContext>(
                options => options.UseNpgsql(connString, npgsqlOptions =>
                npgsqlOptions.CommandTimeout(600)
            ));

            // Register Repositories
            builder.Services.AddScoped<IWeatherForecastRepository, WeatherForecastRepository>();

            // Register Services
            builder.Services.AddScoped<IWeatherForecastService, WeatherForecastService>();


            builder.Services.AddControllers();
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            else
            {
                app.UseHttpsRedirection();
            }

            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}