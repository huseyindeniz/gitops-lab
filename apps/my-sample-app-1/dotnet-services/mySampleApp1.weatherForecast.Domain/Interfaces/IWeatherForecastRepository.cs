using mySampleApp1.weatherForecast.Domain.Entities;

namespace mySampleApp1.weatherForecast.Domain.Interfaces
{
    public interface IWeatherForecastRepository
    {
        Task<IEnumerable<WeatherForecast>> GetAllAsync();
        Task<IEnumerable<WeatherForecast>> GetByDateAsync(DateOnly date);
        Task<WeatherForecast?> GetByIdAsync(int id);
        Task AddAsync(WeatherForecast weatherForecast);
        Task UpdateAsync(WeatherForecast weatherForecast);
        Task DeleteAsync(int id);

    }
}