// Ensure TypeScript files are compiled using ts-node
require('ts-node/register');

// Import Playwright config before running tests
require('./playwright.config');

let common = [
    'tests/features/**/*.feature', // Path to your feature files
    '--require ./tests/steps/**/*.ts', // Path to your step definitions
    '--format progress-bar', // Progress bar format for console output
    `--format-options '{"snippetInterface": "synchronous"}'`, // Sync snippets for steps
].join(' ');

module.exports = {
    default: common
};