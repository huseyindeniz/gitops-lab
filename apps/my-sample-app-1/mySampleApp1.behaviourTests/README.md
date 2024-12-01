# BDD setup

Install playwright and cucumber

```bash
npm init playwright@latest
npm i @cucumber/cucumber -D
npm i ts-node -D
```

create a cucumber.json file

```json
{
  "default": {
    "paths": ["tests/features/"],

    "require": ["tests/steps/*.js"],

    "formatOptions": {
      "snippetInterface": "async-await"
    },

    "format": [
      ["html", "cucumber-report.html"],

      "summary",

      "progress-bar",

      "json:./cucumber-report.json"
    ]
  }
}
```

run tests

```bash
npx cucumber-js test
```

playwright

npx playwright test
Runs the end-to-end tests.

npx playwright test --ui
Starts the interactive UI mode.

npx playwright test --project=chromium
Runs the tests only on Desktop Chrome.

npx playwright test example
Runs the tests in a specific file.

npx playwright test --debug
Runs the tests in debug mode.

npx playwright codegen
Auto generate tests with Codegen.
