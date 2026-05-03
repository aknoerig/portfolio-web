'use strict';

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
	testDir: './test/e2e',
	testMatch: '**/*.spec.js',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	reporter: 'list',
	use: {
		baseURL: 'http://localhost:3001',
		trace: 'on-first-retry',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: 'node test/e2e/server.js',
		url: 'http://localhost:3001',
		reuseExistingServer: !process.env.CI,
		timeout: 60000,
	},
});
