import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { request } from "playwright";

let apiContext: any;
let payload: any;
let response: any;

Given("the Weather Forecast API is running", async function () {
  const baseUrl = process.env.WF_API_BASE_URL;
  if (!baseUrl) {
    throw new Error(
      "Base URL is not defined. Ensure WF_API_BASE_URL is set in the .env file."
    );
  }

  apiContext = await request.newContext({
    baseURL: baseUrl,
  });
});

When(
  "I send a POST request to {string} with the payload",
  async function (endpoint: string) {
    if (!payload) {
      throw new Error(
        "Payload is not defined. Ensure you prepare a payload before sending the request."
      );
    }

    response = await apiContext.post(endpoint, {
      data: payload,
    });
  }
);

Then(
  "the response status code should be {int}",
  function (expectedStatusCode: number) {
    expect(response.status()).toBe(expectedStatusCode);
  }
);

Then(
  "the response should contain validation error messages",
  async function () {
    const responseBody = await response.json();
    expect(responseBody.errors).toBeDefined();
    expect(Array.isArray(responseBody.errors.model)).toBe(true);
    expect(responseBody.errors.model.length).toBeGreaterThan(0);
  }
);

Given('I prepare a valid "create weather forecast" payload', function () {
  payload = {
    date: "2024-12-01",
    temperatureC: 20,
    summary: "Sunny",
  };
});

Given('I prepare an invalid "create weather forecast" payload', function () {
  payload = {
    date: "", // Invalid date
    temperatureC: "not-a-number", // Invalid temperature
  };
});

Then(
  'the response should contain a valid "create weather forecast" ID',
  async function () {
    const responseBody = await response.json();
    expect(responseBody.id).toBeDefined();
    expect(typeof responseBody.id).toBe("number");
    expect(responseBody.id).toBeGreaterThan(0);
  }
);

Then(
  'the response should include the "create weather forecast" details',
  async function () {
    const responseBody = await response.json();
    expect(responseBody.date).toBe(payload.date);
    expect(responseBody.temperatureC).toBe(payload.temperatureC);
    expect(responseBody.summary).toBe(payload.summary);
  }
);
