import { expect, test, type Page } from '@playwright/test';
import { config } from 'dotenv';
import { getRandomString, isValidUrl, sleep } from '../../src/lib/utils';
import pkg from '../../package.json' with { type: 'json' };

const TIMEOUT = 3000;
const DEBUG = process.env.NODE_ENV !== 'production';

if (DEBUG) config({ quiet: true });
const {
	PUBLIC_APP_URL,
	PUBLIC_LINK_URI,
	PUBLIC_TOKEN_URI,
	PRIVATE_TOKEN_EMAIL,
	PRIVATE_VERCEL_APP_NAME = 'burnlink',
	PRIVATE_VERCEL_TEAM_SLUG = null,
	PRIVATE_VERCEL_TEAM_ID = null,
	PRIVATE_VERCEL_USER_ID = null,
	PRIVATE_VERCEL_PROJECT_ID = null,
	PRIVATE_VERCEL_TOKEN = null,
	SHA = null,
} = process.env;
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

test.describe.configure({ mode: 'serial' });

let page: Page;
let link: string;

test.beforeAll(async ({ browser, request }) => {
	console.log('SHA:', SHA);
	console.log('PUBLIC_LINK_URI:', PUBLIC_LINK_URI);
	console.log('PUBLIC_TOKEN_URI:', PUBLIC_TOKEN_URI);
	// https://vercel.com/docs/rest-api/reference/endpoints/deployments/list-deployments
	const response = await request.get(`https://api.vercel.com/v6/deployments?teamId=${PRIVATE_VERCEL_TEAM_ID}`, {
		headers: {
			'Authorization': !!PRIVATE_VERCEL_TOKEN ? `Bearer ${PRIVATE_VERCEL_TOKEN}` : undefined,
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		}
	});
	expect(response.ok()).toBeTruthy();
	expect(response.status()).toBe(200);
	const result = await response.json();
	if (result?.deployments?.length>0) {
		const deployment: object = result.deployments[0];
		if (DEBUG) console.log('deployment:', deployment);
		console.log('deployment state:', deployment.state);
		console.log('deployment githubCommitSha:', deployment.meta.githubCommitSha);
		const date: Date = new Date(new Date().toISOString());
		const spentSec: number = Math.round((date.getTime() - Number(deployment.created)) / 1000);
		console.log('deployment date:', deployment.created, 'spent:', spentSec);
	}

	page = await browser.newPage();
});

test.afterAll(async () => {
	if (page) await page.close();
	console.log('Done with api tests');
});

test('api post requests', async ({ request }) => {
	await sleep(TIMEOUT);
	const apiToken = await request.post(`${PUBLIC_APP_URL}${PUBLIC_TOKEN_URI}`, {
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json'
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
	console.log('api post request token:', token?.length);

	await sleep(TIMEOUT);
	const response = await request.post(`${PUBLIC_APP_URL}${PUBLIC_LINK_URI}`, {
		headers: {
			'Authorization': !!token ? `Bearer ${token}` : undefined,
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		},
		data: {
			text: pkg.repository.url,
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

	link = responseBody.data.link;
	console.log('api post request link:', link?.length);

	await expect(isValidUrl(link)).toBe(true);
	await expect(link.startsWith(PUBLIC_APP_URL)).toBe(true);
});

test('api page check', async () => {
	console.log('page check link:', link?.length);
	await page.goto(link, { waitUntil: 'domcontentloaded' });

	const resultTitle = await page.title();
	await expect(resultTitle).toBe(pkg.title);

	const textarea = page.locator('textarea');
	await expect(textarea).toBeVisible();
	await expect(textarea).toBeDisabled();
	await expect(textarea).not.toBeEditable();

	const value = await textarea.inputValue();
	await expect(value).toBeDefined();
	await expect(isValidUrl(value)).toBe(true);
	await expect(value).toBe(pkg.repository.url);
});
