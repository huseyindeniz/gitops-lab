using AutoFixture;
using mySampleApp1.weatherForecast.Domain.Entities;

namespace mySampleApp1.weatherForecast.UnitTests.Entities
{
    [Trait("Category", "Unit")]
    [Trait("Service", "weatherForecast")]
    public class WeatherForecastTests
    {
        private readonly Fixture _fixture;

        public WeatherForecastTests()
        {
            _fixture = new Fixture();
            // Customize DateOnly generation to ensure it generates a valid date
            _fixture.Customize<DateOnly>(c => c.FromFactory(() =>
                DateOnly.FromDateTime(_fixture.Create<DateTime>().Date)));
        }

        [Fact]
        public void Constructor_ShouldInitializeProperties()
        {
            // Arrange
            var expectedDate = _fixture.Create<DateOnly>();
            int expectedTemperatureC = _fixture.Create<int>();
            string expectedSummary = _fixture.Create<string>();

            // Act
            var forecast = new WeatherForecast(expectedDate, expectedTemperatureC, expectedSummary);

            // Assert
            Assert.Equal(expectedDate, forecast.Date);
            Assert.Equal(expectedTemperatureC, forecast.TemperatureC);
            Assert.Equal(expectedSummary, forecast.Summary);
        }

        [Fact]
        public void Constructor_ShouldAllowNullSummary()
        {
            // Arrange
            var date = _fixture.Create<DateOnly>();
            var temperatureC = _fixture.Create<int>();

            // Act
            var forecast = new WeatherForecast(date, temperatureC, null);

            // Assert
            Assert.Null(forecast.Summary);
        }

    }
}
