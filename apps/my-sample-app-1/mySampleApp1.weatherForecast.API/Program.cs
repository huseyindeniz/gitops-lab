
using mySampleApp1.weatherForecast.Infra;
using Microsoft.EntityFrameworkCore;
using System.Text;
using mySampleApp1.weatherForecast.Domain.Interfaces;
using mySampleApp1.weatherForecast.Infra.Repositories;
using mySampleApp1.weatherForecast.Domain.Services;
using FluentValidation.AspNetCore;
using mySampleApp1.weatherForecast.API.Validators;
using FluentValidation;

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
            connStringBuilder.Append($"server={dbConf["POSTGRES_HOST"]};");
            connStringBuilder.Append($"port={dbConf["POSTGRES_PORT"]};");
            connStringBuilder.Append($"database={dbConf["POSTGRES_DB"]};");
            connStringBuilder.Append($"userid={dbConf["POSTGRES_USER"]};");
            connStringBuilder.Append($"password={dbConf["POSTGRES_PASSWORD"]};");
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
                options => options.UseNpgsql(connString));

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

            app.UseHttpsRedirection();

            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
