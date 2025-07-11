import { expect, test, type Page } from '@playwright/test';
import { config } from 'dotenv';
import { isValidUrl, sleep } from '../../src/lib/utils';
import pkg from '../../package.json' with { type: 'json' };

const TIMEOUT = 3000;
const DEBUG = process.env.NODE_ENV !== 'production';

if (DEBUG) config({ quiet: true });
const { PUBLIC_APP_URL } = process.env;
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

test.describe.configure({ mode: 'serial' });

let page: Page;
let link: string;

test.beforeAll(async ({ browser }) => {
	console.log('PUBLIC_APP_URL:', PUBLIC_APP_URL);
	page = await browser.newPage();
});

test.afterAll(async () => {
	if (page) await page.close();
	console.log('Done with e2e tests');
});

test('home page check', async () => {
	test.slow();
	await sleep(TIMEOUT);
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

	link = await linkTextarea.inputValue();
	await expect(isValidUrl(link)).toBe(true);
	await expect(link.startsWith(PUBLIC_APP_URL)).toBe(true);

	console.log('home page check result:', link?.length);
});

test('e2e page check', async () => {
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
