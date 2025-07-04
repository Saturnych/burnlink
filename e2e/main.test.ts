import { expect, test } from '@playwright/test';
import { config } from 'dotenv';
import { isValidUrl } from '../src/lib/utils';
import pkg from '../package.json' with { type: 'json' };

if (process.env.NODE_ENV !== 'production') config({ quiet: true });
const { PUBLIC_APP_URL, PUBLIC_LINK_URI } = process.env;
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

test('home page has expected h1', async ({ page }) => {
	await page.goto(PUBLIC_APP_URL, { waitUntil: 'domcontentloaded' });
	//console.log(page.workers());
	const title = await page.title();
	await expect(title).toBe(pkg.title);
	await expect(page.locator('h1')).toBeVisible();
	//await expect(locator).toHaveAttribute('type', 'text');
	//await expect(locator).not.toHaveAttribute('open');
});

test('POST request', async ({ page, request }) => {
	const response = await request.post(`${PUBLIC_APP_URL}${PUBLIC_LINK_URI}`, {
		headers: {
			//'Authorization': `token ${process.env.API_TOKEN}`,
			'Content-Type': 'application/json',
			Accept: 'application/json'
		},
		data: {
			text: PUBLIC_APP_URL,
			test: true
		}
	});
	expect(response.ok()).toBeTruthy(); // Checks if the status code is 2xx
	expect(response.status()).toBe(200); // Asserts a specific status code (e.g., Created)

	const responseBody = await response.json();
	expect(responseBody).toHaveProperty('data');
	expect(responseBody).toHaveProperty('success');
	expect(responseBody.success).toBe(true);
	expect(responseBody.data.error).toBeNull();
	expect(responseBody.data.link).toBeDefined();

	await page.goto(responseBody.data.link, { waitUntil: 'domcontentloaded' });

	const locator = page.locator('textarea');
	await expect(locator).toBeVisible();
	await expect(locator).toBeDisabled();
	await expect(locator).not.toBeEditable();

	const value = await locator.inputValue();
	await expect(value).toBeDefined();
	await expect(isValidUrl(value)).toBe(true);
	await expect(value).toBe(PUBLIC_APP_URL);
});

test.afterAll(async () => {
	console.log('Done with tests');
});
