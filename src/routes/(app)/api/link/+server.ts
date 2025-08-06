import type { ServerLoadEvent, RequestHandler, Response } from '@sveltejs/kit';
import createEncryptor from 'simple-encryptor';
import { postForm, returnJson, isValidUrl, sleep, timeout } from '$lib/utils';
import { verifyToken } from '$lib/utils/auth';
import { APP_NAME, APP_DOMAIN, APP_URL } from '$lib/vars/public';
import ENV from '$lib/vars/private';
const {
	DEBUG,
	PRIVATE_TURNSTILE_SECRETKEY,
	PRIVATE_ENCRYPT_KEY = null,
	PRIVATE_ENCRYPT_SALT = 10
} = ENV;

const TIMEOUT = 5000;

const postHandler: RequestHandler = async (event: ServerLoadEvent): Promise<Response> => {
	const result: Record<string, string | string[] | number | boolean | object> = {
		error: null,
		link: null,
		attempts: 0
	};
	try {
		const { url, route, cookies, request } = event;
		let data: Record<string, string | string[] | number | boolean | object> = {
			test: DEBUG
		};
		if (DEBUG) console.log(request.headers);
		const authorization: string = request.headers.get('authorization');
		const token: string = !!authorization ? authorization.split(' ').reverse()[0] : null;
		const contentType: string = request.headers.get('content-type');
		const referer: string = request.headers.get('referer');
		const remoteip: string =
			request.headers.get('CF-Connecting-IP') ||
			request.headers.get('x-forwarded-for')?.split(/\s*,\s*/)[0] ||
			'127.0.0.1';
		if (
			referer?.startsWith(APP_URL) &&
			(contentType.includes('multipart/form-data') ||
				contentType.includes('application/x-www-form-urlencoded'))
		) {
			const formData = await request.formData(); // .text() .formData() .json()
			data['cf-turnstile-response'] = formData?.get('cf-turnstile-response');
			data['uid'] = formData?.get('uid');
			data['link'] = formData?.get('link');
			data['password'] = formData?.get('password');
			data['text'] = formData?.get('text');
			data['expiry'] = Number(formData?.get('expiry') || '0');
			data['redirectlink'] = String(formData?.get('redirectlink')) === 'true' ? true : false;
			data['test'] = String(formData?.get('test')) === 'true' ? true : data['test'];
		} else if ((!!token && verifyToken(token)) || (!!referer && referer.startsWith(APP_URL))) {
			data = Object.assign(data, await request.json());
			data['expiry'] = Number(data['expiry'] || '0');
			data['redirectlink'] = String(data['redirectlink']) === 'true' ? true : false;
			data['test'] = String(data['test']) === 'true' ? true : data['test'];
		}
		if (DEBUG) console.log('POST data:', data);
		if (DEBUG) console.log('POST remoteip:', remoteip);

		const { expiry, link, password, redirectlink, text, uid } = data;
		if (!text && !link) {
			result.error = 'No data!';
			throw new Error(result.error);
		}

		if (PRIVATE_TURNSTILE_SECRETKEY && !!data['cf-turnstile-response']) {
			const result = await postForm(
				{
					secret: PRIVATE_TURNSTILE_SECRETKEY,
					response: data['cf-turnstile-response'],
					remoteip
				},
				'https://challenges.cloudflare.com/turnstile/v0/siteverify'
			);
			if (DEBUG) console.log('turnstile result:', result);
		}

		if (PRIVATE_ENCRYPT_KEY) {
			const expires: number = expiry > 0 ? Date.now() + expiry * 60 * 60 * 1000 : 0;
			const encryptor = createEncryptor(PRIVATE_ENCRYPT_KEY);

			const encryptRetrying = async (obj: object): Promise<string> =>
				Promise.race([
					timeout(TIMEOUT, null),
					new Promise(async (resolve, reject) => {
						result.attempts++;
						const encrypted: string = encryptor.encrypt(obj);
						const decrypted: object = encryptor.decrypt(encrypted);
						if (!!decrypted?.text) resolve(encrypted);
						else {
							await sleep(10);
							reject(null);
						}
					})
				]);

			if (text) {
				const encrypted: string = await encryptRetrying({
					expires,
					password,
					redirectlink,
					text,
					uid
				});
				if (!!encrypted) {
					result.link = `${APP_URL}/${encrypted}`;
				} else {
					result.error = 'Server error';
					throw new Error(result.error);
				}
			} else if (!!link && isValidUrl(link) && !!password) {
				const url = new URL(link);
				const path: string[] = url.pathname.split('/').filter((f) => !!f);
				const decrypted: object = encryptor.decrypt(path.join('/'));
				if (DEBUG) console.log('post decrypted:', !!decrypted);
				if (!!decrypted?.expires && decrypted.expires < Date.now()) {
					result.error = 'Expired';
					throw new Error(result.error);
				}
				if (!!decrypted?.text && password === decrypted.password) {
					result['text'] = decrypted.text;
					result['redirectlink'] = !!decrypted.redirectlink;
				} else {
					result.error = 'Wrong password';
					throw new Error(result.error);
				}
			} else {
				result.error = 'No data';
				throw new Error(result.error);
			}
		} else {
			result.error = 'No keys';
			throw new Error(result.error);
		}
		return returnJson(result);
	} catch (err) {
		console.error(err);
		return returnJson(result, 400, err.details || err.message || 'Error', false);
	}
};

export const POST: RequestHandler = (event: ServerLoadEvent): Response => postHandler(event);

export const PUT: RequestHandler = (event: ServerLoadEvent): Response => postHandler(event);

export const GET: RequestHandler = (event: ServerLoadEvent): Response =>
	returnJson({ error: true }, 404, 'Not found');
