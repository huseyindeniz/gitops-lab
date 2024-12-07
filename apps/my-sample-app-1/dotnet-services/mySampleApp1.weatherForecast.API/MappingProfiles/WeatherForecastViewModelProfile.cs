using AutoMapper;
using mySampleApp1.weatherForecast.API.ViewModels;
using mySampleApp1.weatherForecast.Domain.DTOs;

namespace mySampleApp1.weatherForecast.API.MappingProfiles
{
    public class WeatherForecastViewModelProfile : Profile
    {
        public WeatherForecastViewModelProfile()
        {
            // Map WeatherForecast to WeatherForecastViewModel
            CreateMap<WeatherForecastDTO, WeatherForecastViewModel>();
        }

    }
}
