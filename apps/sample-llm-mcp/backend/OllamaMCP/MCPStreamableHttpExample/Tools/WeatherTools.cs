using ModelContextProtocol.Server;
using System.ComponentModel;
using System.Globalization;
using System.Text.Json;

namespace MCPStreamableHttpExample.Tools
{
    [McpServerToolType]
    public static class WeatherTools
    {
        [McpServerTool, Description("Get current weather for a location.")]
        public static async Task<string> GetCurrentWeather(
            [Description("Latitude of the location.")] double latitude,
            [Description("Longitude of the location.")] double longitude)
        {
            // 1) Build the *absolute* URL so we know exactly what's called.
            var lat = latitude.ToString(CultureInfo.InvariantCulture);
            var lon = longitude.ToString(CultureInfo.InvariantCulture);
            var url =
              $"https://api.open-meteo.com/v1/forecast" +
              $"?latitude={lat}&longitude={lon}&current_weather=true";

            // 2) Log it (you can remove these Console.WriteLine's once it's working)
            Console.WriteLine($"[WeatherTool] Requesting: {url}");

            using var client = new HttpClient();
            client.DefaultRequestHeaders.UserAgent.ParseAdd("weather-tool/1.0");

            // 3) Send the request manually so we can inspect exactly what comes back
            using var resp = await client.GetAsync(url);
            var body = await resp.Content.ReadAsStringAsync();
            Console.WriteLine($"[WeatherTool] Status: {(int)resp.StatusCode} {resp.ReasonPhrase}");
            Console.WriteLine($"[WeatherTool] Body: {body}");

            if (!resp.IsSuccessStatusCode)
            {
                // bubble up the real error
                return $"Error while getting weather: HTTP {(int)resp.StatusCode} – {resp.ReasonPhrase}";
            }

            // 4) Parse the JSON and extract your data
            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            if (!root.TryGetProperty("current_weather", out var current) ||
                !root.TryGetProperty("current_weather_units", out var units))
            {
                return JsonSerializer.Serialize(new
                {
                    error = "Current weather data not available."
                });
            }

            var result = new
            {
                time = current.GetProperty("time").GetString(),
                temperature = new
                {
                    value = current.GetProperty("temperature").GetDouble(),
                    unit = units.GetProperty("temperature").GetString()
                },
                wind_speed = new
                {
                    value = current.GetProperty("windspeed").GetDouble(),
                    unit = units.GetProperty("windspeed").GetString()
                },
                wind_direction = new
                {
                    value = current.GetProperty("winddirection").GetDouble(),
                    unit = units.GetProperty("winddirection").GetString()
                }
            };

            return JsonSerializer.Serialize(result);
        }
    }
}
