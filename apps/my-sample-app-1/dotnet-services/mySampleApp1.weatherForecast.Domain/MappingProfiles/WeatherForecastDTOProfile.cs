using AutoMapper;
using mySampleApp1.weatherForecast.Domain.DTOs;
using mySampleApp1.weatherForecast.Domain.Entities;

namespace mySampleApp1.weatherForecast.Domain.MappingProfiles
{
    public class WeatherForecastDTOProfile : Profile
    {
        public WeatherForecastDTOProfile()
        {
            // Map WeatherForecast to WeatherForecastDTO
            CreateMap<WeatherForecast, WeatherForecastDTO>()
                .ReverseMap();
        }

    }
}
