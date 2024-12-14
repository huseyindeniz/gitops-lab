namespace mySampleApp1.weatherForecast.API.ViewModels
{
    public class WeatherForecastViewModel
    {
        public int Id { get; set; }

        public DateOnly Date { get; private set; }

        public int TemperatureC { get; private set; }

        public int TemperatureF { get; private set; }

        public string? Summary { get; private set; }

    }
}