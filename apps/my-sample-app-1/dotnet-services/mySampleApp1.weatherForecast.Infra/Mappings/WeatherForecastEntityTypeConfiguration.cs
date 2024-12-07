using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using mySampleApp1.weatherForecast.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace mySampleApp1.weatherForecast.Infra.Mappings
{
    public class WeatherForecastEntityTypeConfiguration : IEntityTypeConfiguration<WeatherForecast>
    {

        public void Configure(EntityTypeBuilder<WeatherForecast> builder)
        {
            builder
                .ToTable("WeatherForecasts");


            builder
                .HasKey(b => b.Id);

            builder
                .Property(b => b.Id)
                .HasColumnName("Id")
                .IsRequired();


            builder
                .Property(b => b.Date)
                .HasColumnName("Date")
                .IsRequired();

            builder
                .Property(b => b.TemperatureC)
                .HasColumnName("TemperatureC")
                .IsRequired();

            builder
                .Property(b => b.Source)
                .HasColumnName("Source")
                .HasMaxLength(50);

            builder
                .Property(b => b.Summary)
                .HasColumnName("Summary")
                .HasMaxLength(200);

        }
    }
}
