Feature: Create Weather Forecast
  As a user of the Weather Forecast API
  I want to create a new weather forecast
  So that I can store forecast information in the system

  Background:
    Given the Weather Forecast API is running

  Scenario: Successfully create a weather forecast
    Given I prepare a valid "create weather forecast" payload
    When I send a POST request to "/WeatherForecast" with the payload
    Then the response status code should be 201
    And the response should contain a valid "create weather forecast" ID
    And the response should include the "create weather forecast" details

  Scenario: Fail to create a weather forecast due to invalid payload
    Given I prepare an invalid "create weather forecast" payload
    When I send a POST request to "/WeatherForecast" with the payload
    Then the response status code should be 400
    And the response should contain validation error messages
