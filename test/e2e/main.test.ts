import { expect, test } from '@playwright/test';
import { config } from 'dotenv';
import { isValidUrl, sleep } from '../../src/lib/utils';
import pkg from '../../package.json' with { type: 'json' };

const TIMEOUT = 3000;
const DEBUG = process.env.NODE_ENV !== 'production';

if (DEBUG) config({ quiet: true });
const { PUBLIC_APP_URL, PUBLIC_LINK_URI } = process.env;
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

test('home page has expected h1', async ({ page }) => {
	test.slow();
	await page.goto(PUBLIC_APP_URL, { waitUntil: 'domcontentloaded' });
	//console.log(page.workers());
	const title = await page.title();
	await expect(title).toBe(pkg.title);
	const h1 = page.locator('h1');
	await expect(h1).toBeVisible();
	await page.getByText('Show example').click();
	await page.getByTitle('Redirect to result URL').uncheck(); // no redirect !
	const linkTextarea = await page.getByTitle('Result link');
	await expect(linkTextarea).toBeVisible();
	await expect(linkTextarea).toBeDisabled();
	await expect(linkTextarea).not.toBeEditable();
	await sleep(TIMEOUT);
	const linkValue = await linkTextarea.inputValue();
	await expect(isValidUrl(linkValue)).toBe(true);
	await expect(linkValue.startsWith(PUBLIC_APP_URL)).toBe(true);

	await page.goto(linkValue, { waitUntil: 'domcontentloaded' });

	const resultTitle = await page.title();
	await expect(resultTitle).toBe(pkg.title);

	const resultTextarea = page.locator('textarea');
	await expect(resultTextarea).toBeVisible();
	await expect(resultTextarea).toBeDisabled();
	await expect(resultTextarea).not.toBeEditable();

	const resultValue = await resultTextarea.inputValue();
	await expect(resultValue).toBeDefined();
	await expect(isValidUrl(resultValue)).toBe(true);
	await expect(resultValue).toBe(pkg.repository.url);
});

test.afterAll(() => {
	console.log('Done with e2e tests');
});
