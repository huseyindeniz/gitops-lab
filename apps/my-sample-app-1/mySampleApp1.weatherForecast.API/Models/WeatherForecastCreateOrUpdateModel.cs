namespace mySampleApp1.weatherForecast.API.Models
{
    public class WeatherForecastCreateOrUpdateModel
    {
        public DateOnly Date { get; set; }
        public int TemperatureC { get; set; }
        public string? Summary { get; set; }

    }
}
