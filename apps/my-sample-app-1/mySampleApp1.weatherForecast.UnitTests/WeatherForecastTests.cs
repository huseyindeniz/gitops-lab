using mySampleApp1.weatherForecast.Domain;

namespace mySampleApp1.weatherForecast.UnitTests
{
    [Trait("Category", "Unit")]
    [Trait("Microservice", "weatherForecasts")]
    public class WeatherForecastTests
    {
        [Fact]
        public void Constructor_ShouldInitializeProperties()
        {
            // Arrange
            var expectedDate = DateOnly.FromDateTime(DateTime.Now);
            int expectedTemperatureC = 25;
            string expectedSummary = "Warm";

            // Act
            var forecast = new WeatherForecast(expectedDate, expectedTemperatureC, expectedSummary);

            // Assert
            Assert.Equal(expectedDate, forecast.Date);
            Assert.Equal(expectedTemperatureC, forecast.TemperatureC);
            Assert.Equal(expectedSummary, forecast.Summary);
        }

        [Fact]
        public void TemperatureF_ShouldCalculateCorrectly()
        {
            // Arrange
            var date = DateOnly.FromDateTime(DateTime.Now);
            int temperatureC = 0; // Celsius
            var forecast = new WeatherForecast(date, temperatureC, null);

            // Act
            int expectedTemperatureF = 32; // 32 + (0 / 0.5556) = 32
            int actualTemperatureF = forecast.TemperatureF;

            // Assert
            Assert.Equal(expectedTemperatureF, actualTemperatureF);
        }
    }
}