using mySampleApp1.weatherForecast.Domain.DTOs;

namespace mySampleApp1.weatherForecast.Domain.Interfaces
{
    public interface IWeatherForecastService
    {
        Task<IEnumerable<WeatherForecastDTO>> GetAllForecastsAsync();
        Task<WeatherForecastDTO?> GetForecastByIdAsync(int id);
        Task<IEnumerable<WeatherForecastDTO>> GetForecastsByDateAsync(DateOnly date);
        Task<int> AddForecastAsync(WeatherForecastDTO weatherForecast);
        Task UpdateForecastAsync(WeatherForecastDTO weatherForecast);
        Task DeleteForecastAsync(int id);

    }
}
