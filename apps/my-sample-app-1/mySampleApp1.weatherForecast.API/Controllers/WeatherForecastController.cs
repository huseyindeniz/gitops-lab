using Microsoft.AspNetCore.Mvc;
using mySampleApp1.weatherForecast.Domain;
using mySampleApp1.weatherForecast.Domain.services;

namespace mySampleApp1.weatherForecast.API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class WeatherForecastController : ControllerBase
    {
        private readonly ILogger<WeatherForecastController> _logger;

        public WeatherForecastController(ILogger<WeatherForecastController> logger)
        {
            _logger = logger;
        }

        [HttpGet(Name = "GetWeatherForecast")]
        public IEnumerable<WeatherForecast> Get()
        {
            return FakeForecastGenerator.GenerateFakeForecasts();
        }
    }
}
