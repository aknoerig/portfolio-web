'use strict';

const { test, expect } = require('@playwright/test');

test.describe('Navigation bar', () => {
	test('brand link "André Knörig" is present and points to /', async ({ page }) => {
		await page.goto('/bio');
		const brand = page.locator('a.navbar-brand');
		await expect(brand).toBeVisible();
		await expect(brand).toHaveText('André Knörig');
		await expect(brand).toHaveAttribute('href', '/');
	});

	test('all four nav links are present', async ({ page }) => {
		await page.goto('/bio');
		const links = page.locator('ul.navbar-nav li a');
		await expect(links).toHaveCount(4);
		const hrefs = await links.evaluateAll(els => els.map(el => el.getAttribute('href')));
		expect(hrefs).toEqual(['/works', '/activities', '/bio', '/contact']);
	});

	test('clicking the brand navigates to /', async ({ page }) => {
		await page.goto('/bio');
		await page.click('a.navbar-brand');
		await expect(page).toHaveURL('/');
	});

	test('clicking "Works" navigates to /works', async ({ page }) => {
		await page.goto('/');
		await page.click('ul.navbar-nav a[href="/works"]');
		await expect(page).toHaveURL('/works');
	});

	test('"Bio" nav item is active on /bio', async ({ page }) => {
		await page.goto('/bio');
		const bioItem = page.locator('ul.navbar-nav li.active a[href="/bio"]');
		await expect(bioItem).toBeVisible();
	});

	test('"Contact" nav item is active on /contact', async ({ page }) => {
		await page.goto('/contact');
		const contactItem = page.locator('ul.navbar-nav li.active a[href="/contact"]');
		await expect(contactItem).toBeVisible();
	});

	test('no nav item is active on the home page', async ({ page }) => {
		await page.goto('/');
		const activeItems = page.locator('ul.navbar-nav li.active');
		await expect(activeItems).toHaveCount(0);
	});
});
