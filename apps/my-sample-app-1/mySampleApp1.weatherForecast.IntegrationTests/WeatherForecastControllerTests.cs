using Microsoft.AspNetCore.Mvc.Testing;
using mySampleApp1.weatherForecast.API;
using mySampleApp1.weatherForecast.Domain;
using System.Text.Json;

namespace mySampleApp1.weatherForecast.IntegrationTests
{
    public class WeatherForecastControllerTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public WeatherForecastControllerTests(WebApplicationFactory<Program> factory)
        {
            // Configure the test server
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetWeatherForecast_ShouldReturnSuccessAndCorrectContentType()
        {
            // Act
            var response = await _client.GetAsync("/WeatherForecast");

            // Assert
            response.EnsureSuccessStatusCode(); // Status Code 200-299
            Assert.Equal("application/json; charset=utf-8", response.Content.Headers.ContentType.ToString());
        }

        [Fact]
        public async Task GetWeatherForecast_ShouldReturnFiveForecasts()
        {
            // Act
            var response = await _client.GetAsync("/WeatherForecast");
            response.EnsureSuccessStatusCode();

            var responseString = await response.Content.ReadAsStringAsync();
            var forecasts = JsonSerializer.Deserialize<IEnumerable<WeatherForecast>>(responseString, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            // Assert
            Assert.NotNull(forecasts);
            Assert.Equal(5, forecasts.Count());
        }
    }
}