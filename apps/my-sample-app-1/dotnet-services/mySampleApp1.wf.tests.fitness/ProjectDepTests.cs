using mySampleApp1.weatherForecast.API.Controllers;

using NetArchTest.Rules;

namespace mySampleApp1.wf.tests.fitness
{
    [Trait("Category", "Fitness")]
    [Trait("Service", "weatherForecast")]
    public class ProjectDependencyTests
    {
        [Fact]
        public void WFControllersShouldNotAccessInfra()
        {
            var result = Types.InAssembly(typeof(WeatherForecastController).Assembly)
                .That()
                .ResideInNamespace("mySampleApp1.weatherForecast.API.Controllers")
                .ShouldNot()
                .HaveDependencyOn("mySampleApp1.weatherForecast.Infra")
                .GetResult();

            Assert.True(result.IsSuccessful);
        }


    }
}