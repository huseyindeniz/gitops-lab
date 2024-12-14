using AutoMapper;

using mySampleApp1.weatherForecast.Domain.DTOs;
using mySampleApp1.weatherForecast.Domain.Entities;
using mySampleApp1.weatherForecast.Domain.Interfaces;

namespace mySampleApp1.weatherForecast.Domain.Services
{
    public class WeatherForecastService : IWeatherForecastService
    {
        private readonly IMapper _mapper;
        private readonly IWeatherForecastRepository _repository;

        public WeatherForecastService(IWeatherForecastRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<WeatherForecastDTO>> GetAllForecastsAsync()
        {
            var forecasts = await _repository.GetAllAsync();
            return _mapper.Map<IEnumerable<WeatherForecastDTO>>(forecasts);
        }

        public async Task<WeatherForecastDTO?> GetForecastByIdAsync(int id)
        {
            var forecast = await _repository.GetByIdAsync(id);
            return _mapper.Map<WeatherForecastDTO>(forecast);
        }

        public async Task<IEnumerable<WeatherForecastDTO>> GetForecastsByDateAsync(DateOnly date)
        {
            var forecasts = await _repository.GetByDateAsync(date);
            return _mapper.Map<IEnumerable<WeatherForecastDTO>>(forecasts);
        }

        public async Task<int> AddForecastAsync(WeatherForecastDTO weatherForecastDto)
        {
            var weatherForecast = _mapper.Map<WeatherForecast>(weatherForecastDto);
            await _repository.AddAsync(weatherForecast);
            return weatherForecast.Id;
        }

        public async Task UpdateForecastAsync(WeatherForecastDTO weatherForecastDto)
        {
            var weatherForecast = _mapper.Map<WeatherForecast>(weatherForecastDto);
            await _repository.UpdateAsync(weatherForecast);
        }

        public async Task DeleteForecastAsync(int id)
        {
            await _repository.DeleteAsync(id);
        }

    }
}