﻿using mySampleApp1.weatherForecast.Domain.services;

namespace mySampleApp1.weatherForecast.UnitTests.services
{
    [Trait("Category", "Unit")]
    [Trait("Microservice", "weatherForecast")]
    public class FakeForecastGeneratorTests
    {
        [Fact]
        public void GenerateFakeForecasts_ShouldReturnFiveForecasts()
        {
            // Act
            var forecasts = FakeForecastGenerator.GenerateFakeForecasts();

            // Assert
            Assert.NotNull(forecasts);
            Assert.Equal(5, forecasts.Count());
        }

        [Fact]
        public void GenerateFakeForecasts_ShouldHaveValidSummaries()
        {
            // Arrange
            var validSummaries = FakeForecastGenerator.Summaries;

            // Act
            var forecasts = FakeForecastGenerator.GenerateFakeForecasts();

            // Assert
            Assert.All(forecasts, forecast =>
            {
                Assert.Contains(forecast.Summary, validSummaries);
            });
        }

    }
}
