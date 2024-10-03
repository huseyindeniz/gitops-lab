namespace mySampleApp1.weatherForecast.Domain.DTOs
{
    public class WeatherForecastDTO
    {
        public int Id { get; set; }

        public DateOnly Date { get; private set; }

        public int TemperatureC { get; private set; }

        public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);

        public string? Summary { get; private set; }
    }
}
