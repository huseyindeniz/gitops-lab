using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using mySampleApp1.weatherForecast.API.Models;
using mySampleApp1.weatherForecast.API.ViewModels;
using mySampleApp1.weatherForecast.Domain.DTOs;
using mySampleApp1.weatherForecast.Domain.Interfaces;

namespace mySampleApp1.weatherForecast.API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class WeatherForecastController : ControllerBase
    {
        private readonly ILogger<WeatherForecastController> _logger;
        private readonly IMapper _mapper;
        private readonly IWeatherForecastService _weatherForecastService;

        public WeatherForecastController(ILogger<WeatherForecastController> logger, IMapper mapper, IWeatherForecastService weatherForecastService)
        {
            _logger = logger;
            _weatherForecastService = weatherForecastService;
            _mapper = mapper;
        }

        [HttpGet(Name = "GetAllWeatherForecasts")]
        public async Task<ActionResult<IEnumerable<WeatherForecastViewModel>>> GetAll()
        {
            var forecasts = await _weatherForecastService.GetAllForecastsAsync();
            var viewModels = _mapper.Map<IEnumerable<WeatherForecastViewModel>>(forecasts);
            return Ok(viewModels);
        }

        [HttpGet("{id}", Name = "GetWeatherForecastById")]
        public async Task<ActionResult<WeatherForecastViewModel>> GetById(int id)
        {
            var forecast = await _weatherForecastService.GetForecastByIdAsync(id);
            if (forecast == null)
                return NotFound();

            var viewModel = _mapper.Map<WeatherForecastViewModel>(forecast);
            return Ok(viewModel);
        }

        [HttpPost(Name = "CreateWeatherForecast")]
        public async Task<ActionResult> Create([FromBody] WeatherForecastCreateOrUpdateModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var forecastDTO = _mapper.Map<WeatherForecastDTO>(model);
            var forecastId = await _weatherForecastService.AddForecastAsync(forecastDTO);
            return CreatedAtRoute("GetWeatherForecastById", new { id = forecastId }, model);
        }

        [HttpPut("{id}", Name = "UpdateWeatherForecast")]
        public async Task<ActionResult> Update(int id, [FromBody] WeatherForecastCreateOrUpdateModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingForecast = await _weatherForecastService.GetForecastByIdAsync(id);
            if (existingForecast == null)
                return NotFound();

            _mapper.Map(model, existingForecast);

            await _weatherForecastService.UpdateForecastAsync(existingForecast);
            return NoContent();
        }

        [HttpDelete("{id}", Name = "DeleteWeatherForecast")]
        public async Task<ActionResult> Delete(int id)
        {
            var existingForecast = await _weatherForecastService.GetForecastByIdAsync(id);
            if (existingForecast == null)
                return NotFound();

            await _weatherForecastService.DeleteForecastAsync(id);
            return NoContent();
        }

    }
}
