using AutoMapper;

using FluentValidation;

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
        private readonly IValidator<WeatherForecastCreateOrUpdateModel> _validator;
        private readonly IMapper _mapper;
        private readonly IWeatherForecastService _weatherForecastService;

        public WeatherForecastController(ILogger<WeatherForecastController> logger, IValidator<WeatherForecastCreateOrUpdateModel> validator, IMapper mapper, IWeatherForecastService weatherForecastService)
        {
            _logger = logger;
            _validator = validator;
            _weatherForecastService = weatherForecastService;
            _mapper = mapper;
        }

        [HttpGet(Name = "GetAllWeatherForecasts")]
        [ProducesResponseType(typeof(IEnumerable<WeatherForecastViewModel>), StatusCodes.Status200OK)] // For successful retrieval
        [ProducesResponseType(StatusCodes.Status500InternalServerError)] // For server errors
        public async Task<ActionResult<IEnumerable<WeatherForecastViewModel>>> GetAll()
        {
            var forecasts = await _weatherForecastService.GetAllForecastsAsync();
            var viewModels = _mapper.Map<IEnumerable<WeatherForecastViewModel>>(forecasts);
            return Ok(viewModels);
        }

        [HttpGet("{id}", Name = "GetWeatherForecastById")]
        [ProducesResponseType(typeof(WeatherForecastViewModel), StatusCodes.Status200OK)] // For successful retrieval
        [ProducesResponseType(StatusCodes.Status404NotFound)] // When the forecast is not found
        [ProducesResponseType(StatusCodes.Status500InternalServerError)] // For server errors
        public async Task<ActionResult<WeatherForecastViewModel>> GetById(int id)
        {
            var forecast = await _weatherForecastService.GetForecastByIdAsync(id);
            if (forecast == null)
                return NotFound();

            var viewModel = _mapper.Map<WeatherForecastViewModel>(forecast);
            return Ok(viewModel);
        }

        [HttpPost(Name = "CreateWeatherForecast")]
        [ProducesResponseType(typeof(WeatherForecastResponseModel), StatusCodes.Status201Created)] // For successful creation
        [ProducesResponseType(StatusCodes.Status400BadRequest)] // For invalid input
        [ProducesResponseType(StatusCodes.Status500InternalServerError)] // For server errors
        public async Task<ActionResult<WeatherForecastResponseModel>> Create([FromBody] WeatherForecastCreateOrUpdateModel model)
        {
            var validationResult = await _validator.ValidateAsync(model);
            if (!validationResult.IsValid)
            {
                foreach (var error in validationResult.Errors)
                {
                    ModelState.AddModelError(error.PropertyName, error.ErrorMessage);
                }
                return BadRequest(ModelState);
            }
            var forecastDTO = _mapper.Map<WeatherForecastDTO>(model);
            var forecastId = await _weatherForecastService.AddForecastAsync(forecastDTO);

            var response = new WeatherForecastResponseModel
            {
                Id = forecastId,
                Date = model.Date,
                TemperatureC = model.TemperatureC,
                Summary = model.Summary
            };

            return CreatedAtRoute("GetWeatherForecastById", new { id = forecastId }, response);
        }

        [HttpPut("{id}", Name = "UpdateWeatherForecast")]
        [ProducesResponseType(StatusCodes.Status204NoContent)] // For successful update
        [ProducesResponseType(StatusCodes.Status400BadRequest)] // For invalid input
        [ProducesResponseType(StatusCodes.Status404NotFound)] // When the forecast is not found
        [ProducesResponseType(StatusCodes.Status500InternalServerError)] // For server errors
        public async Task<ActionResult> Update(int id, [FromBody] WeatherForecastCreateOrUpdateModel model)
        {
            var validationResult = await _validator.ValidateAsync(model);
            if (!validationResult.IsValid)
            {
                foreach (var error in validationResult.Errors)
                {
                    ModelState.AddModelError(error.PropertyName, error.ErrorMessage);
                }
                return BadRequest(ModelState);
            }

            var existingForecast = await _weatherForecastService.GetForecastByIdAsync(id);
            if (existingForecast == null)
                return NotFound();

            _mapper.Map(model, existingForecast);

            await _weatherForecastService.UpdateForecastAsync(existingForecast);
            return NoContent();
        }

        [HttpDelete("{id}", Name = "DeleteWeatherForecast")]
        [ProducesResponseType(StatusCodes.Status204NoContent)] // For successful deletion
        [ProducesResponseType(StatusCodes.Status404NotFound)] // When the forecast is not found
        [ProducesResponseType(StatusCodes.Status500InternalServerError)] // For server errors
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