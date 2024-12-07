using FluentValidation;
using mySampleApp1.weatherForecast.API.Models;

namespace mySampleApp1.weatherForecast.API.Validators
{
    public class WeatherForecastCreateOrUpdateModelValidator : AbstractValidator<WeatherForecastCreateOrUpdateModel>
    {
        public WeatherForecastCreateOrUpdateModelValidator()
        {
            RuleFor(x => x.Date)
                .NotEmpty()
                .WithMessage("Date is required.");

            RuleFor(x => x.TemperatureC)
                .NotNull()
                .WithMessage("Temperature is required.");

            RuleFor(x => x.Summary)
                .MaximumLength(200)
                .WithMessage("Summary must not exceed 200 characters.");
        }
    }
}
