using Microsoft.EntityFrameworkCore;
using mySampleApp1.weatherForecast.Domain.Entities;
using mySampleApp1.weatherForecast.Domain.Interfaces;

namespace mySampleApp1.weatherForecast.Infra.Repositories
{
    public class WeatherForecastRepository : IWeatherForecastRepository
    {
        private readonly ApplicationDbContext _context;

        public WeatherForecastRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<WeatherForecast>> GetAllAsync()
        {
            return await _context.Set<WeatherForecast>()
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IEnumerable<WeatherForecast>> GetByDateAsync(DateOnly date)
        {
            return await _context.Set<WeatherForecast>()
                .AsNoTracking()
                .Where(wf => wf.Date == date)
                .ToListAsync();
        }

        public async Task<WeatherForecast?> GetByIdAsync(int id)
        {
            return await _context.Set<WeatherForecast>()
                .AsNoTracking()
                .FirstOrDefaultAsync(wf => wf.Id == id);
        }   

        public async Task AddAsync(WeatherForecast weatherForecast)
        {
            await _context.Set<WeatherForecast>().AddAsync(weatherForecast);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(WeatherForecast weatherForecast)
        {
            _context.Set<WeatherForecast>().Update(weatherForecast);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await GetByIdAsync(id);
            if (entity != null)
            {
                _context.Set<WeatherForecast>().Remove(entity);
                await _context.SaveChangesAsync();
            }
        }
    }
}
