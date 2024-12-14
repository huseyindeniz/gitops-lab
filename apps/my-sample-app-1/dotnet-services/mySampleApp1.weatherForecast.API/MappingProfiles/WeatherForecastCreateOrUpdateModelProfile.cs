using AutoMapper;

using mySampleApp1.weatherForecast.API.Models;
using mySampleApp1.weatherForecast.Domain.DTOs;

namespace mySampleApp1.weatherForecast.API.MappingProfiles
{
    public class WeatherForecastCreateOrUpdateProfile : Profile
    {
        public WeatherForecastCreateOrUpdateProfile()
        {
            // Map WeatherForecastCreateOrUpdateModel to WeatherForecastDTO
            CreateMap<WeatherForecastDTO, WeatherForecastCreateOrUpdateModel>()
                .ReverseMap();
        }

    }
}