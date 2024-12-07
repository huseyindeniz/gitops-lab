using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Logging;
using Moq;
using mySampleApp1.weatherForecast.API;
using mySampleApp1.weatherForecast.API.Controllers;
using mySampleApp1.weatherForecast.API.MappingProfiles;
using mySampleApp1.weatherForecast.API.ViewModels;
using mySampleApp1.weatherForecast.Domain.DTOs;
using mySampleApp1.weatherForecast.Domain.Entities;
using mySampleApp1.weatherForecast.Domain.Interfaces;
using mySampleApp1.weatherForecast.Domain.MappingProfiles;
using mySampleApp1.weatherForecast.Domain.Services;

namespace mySampleApp1.weatherForecast.IntegrationTests
{
    [Trait("Category", "Integration")]
    [Trait("Service", "weatherForecast")]
    public class WeatherForecastControllerTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly Mock<IWeatherForecastRepository> _mockRepository;
        private readonly Mock<ILogger<WeatherForecastController>> _mockLogger;
        private readonly IMapper _mapper;
        private readonly WeatherForecastService _weatherForecastService;
        private readonly WeatherForecastController _weatherForecastController;

        public WeatherForecastControllerTests(WebApplicationFactory<Program> factory)
        {

            // Initialize mocks
            _mockRepository = new Mock<IWeatherForecastRepository>();
            _mockLogger = new Mock<ILogger<WeatherForecastController>>();

            // Crate the AutoMapper
            var configuration = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile(new WeatherForecastViewModelProfile());
                cfg.AddProfile(new WeatherForecastDTOProfile());
            });
            _mapper = configuration.CreateMapper();

            // Create the WeatherForecastService
            _weatherForecastService = new WeatherForecastService(
                _mockRepository.Object,
                _mapper
            );

            // Create the WeatherForecastController
            _weatherForecastController = new WeatherForecastController(
                _mockLogger.Object,
                _mapper,
                _weatherForecastService
             );

        }

        [Fact]
        public async Task GetAllWeatherForecast_ShouldReturnSuccessAndCorrectContentType()
        {
            // Arrange: Setup mock data for WeatherForecast and corresponding WeatherForecastDTOs
            var mockForecasts = new List<WeatherForecast>
            {
                new WeatherForecast(DateOnly.FromDateTime(DateTime.Now), 25, "Warm day") { Id = 1 },
                new WeatherForecast(DateOnly.FromDateTime(DateTime.Now), 30, "Hot day") { Id = 2 }
            };

            // Setup the repository mock to return the forecast list
            _mockRepository.Setup(repo => repo.GetAllAsync())
                .ReturnsAsync(mockForecasts);

            // Map WeatherForecasts to WeatherForecastDTOs using AutoMapper
            var mockForecastDTOs = _mapper.Map<List<WeatherForecastDTO>>(mockForecasts);

            // Map WeatherForecastDTOs to WeatherForecastViewModels using AutoMapper
            var expectedViewModels = _mapper.Map<List<WeatherForecastViewModel>>(mockForecastDTOs);


            // Act: Make the request to the endpoint
            var response = await _weatherForecastController.GetAll();

            // Assert: Check that the response is Ok with a list of WeatherForecastViewModel
            var okResult = response.Result as OkObjectResult;
            okResult.Should().NotBeNull();
            okResult.Value.Should().BeEquivalentTo(expectedViewModels);

        }

        [Fact]
        public async Task GetAllWeatherForecast_ShouldReturnEmptyList_WhenNoForecastsExist()
        {
            // Arrange: Setup the repository mock to return an empty list
            _mockRepository.Setup(repo => repo.GetAllAsync())
                .ReturnsAsync(new List<WeatherForecast>());

            // Act: Make the request to the endpoint
            var response = await _weatherForecastController.GetAll();

            // Assert: Check that the response is Ok with an empty list
            var okResult = response.Result as OkObjectResult;
            okResult.Should().NotBeNull();
            var viewModels = okResult.Value as List<WeatherForecastViewModel>;
            viewModels.Should().BeEmpty();
        }

    }
}