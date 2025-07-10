import { expect, test } from '@playwright/test';
import { config } from 'dotenv';
import { getRandomString, isValidUrl } from '../../src/lib/utils';

const DEBUG = process.env.NODE_ENV !== 'production';

if (DEBUG) config({ quiet: true });
const { PUBLIC_APP_URL, PUBLIC_LINK_URI, PUBLIC_TOKEN_URI, PRIVATE_TOKEN_EMAIL } = process.env;
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

test.beforeAll(() => {
	console.log('PUBLIC_LINK_URI:', PUBLIC_LINK_URI);
	console.log('PUBLIC_TOKEN_URI:', PUBLIC_TOKEN_URI);
});

test('api post request', async ({ page, request }) => {
	const apiToken = await request.post(`${PUBLIC_APP_URL}${PUBLIC_TOKEN_URI}`, {
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json'
		},
		data: {
			email: PRIVATE_TOKEN_EMAIL,
			uid: getRandomString(),
			test: true
		}
	});
	expect(apiToken.ok()).toBeTruthy(); // Checks if the status code is 2xx
	expect(apiToken.status()).toBe(200); // Asserts a specific status code (e.g., Created)

	const apiTokenBody = await apiToken.json();
	expect(apiTokenBody).toHaveProperty('data');
	expect(apiTokenBody).toHaveProperty('success');
	expect(apiTokenBody.success).toBe(true);
	expect(apiTokenBody.data.error).toBeNull();
	expect(apiTokenBody.data.token).toBeDefined();
	expect(apiTokenBody.data.user).toBeDefined();

	const token: string = apiTokenBody.data.token;

	const response = await request.post(`${PUBLIC_APP_URL}${PUBLIC_LINK_URI}`, {
		headers: {
			Authorization: !!token ? `Bearer ${token}` : undefined,
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

	const textarea = page.locator('textarea');
	await expect(textarea).toBeVisible();
	await expect(textarea).toBeDisabled();
	await expect(textarea).not.toBeEditable();

	const value = await textarea.inputValue();
	await expect(value).toBeDefined();
	await expect(isValidUrl(value)).toBe(true);
	await expect(value).toBe(PUBLIC_APP_URL);
});

test.afterAll(() => {
	console.log('Done with api tests');
});
