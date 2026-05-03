'use strict';

const { test, expect } = require('@playwright/test');

test.describe('Page content', () => {
	test('home page (/) loads successfully', async ({ page }) => {
		const res = await page.goto('/');
		expect(res.status()).toBe(200);
	});

	test('/works loads successfully', async ({ page }) => {
		const res = await page.goto('/works');
		expect(res.status()).toBe(200);
	});

	test('/bio has "Bio" as its heading', async ({ page }) => {
		await page.goto('/bio');
		await expect(page.locator('#body h1')).toHaveText('Bio');
	});

	test('/bio has Work Experience section', async ({ page }) => {
		await page.goto('/bio');
		await expect(page.locator('h2#work-experience')).toBeVisible();
	});

	test('/contact has "Contact" as its heading', async ({ page }) => {
		await page.goto('/contact');
		await expect(page.locator('#body h1')).toHaveText('Contact');
	});

	test('/contact shows "Say hello!" and contact details', async ({ page }) => {
		await page.goto('/contact');
		await expect(page.locator('h4', { hasText: 'Say hello!' })).toBeVisible();
		await expect(page.locator('a[href^="mailto:"]')).toBeVisible();
		await expect(page.locator('a[href^="tel:"]')).toBeVisible();
	});

	test('/imprint loads successfully', async ({ page }) => {
		const res = await page.goto('/imprint');
		expect(res.status()).toBe(200);
	});

	test('unknown route returns 404', async ({ page }) => {
		const res = await page.goto('/nonexistent-page-xyz');
		expect(res.status()).toBe(404);
	});
});
