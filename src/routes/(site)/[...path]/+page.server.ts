import type { ServerLoadEvent, RequestHandler, Response } from '@sveltejs/kit';
import createEncryptor from 'simple-encryptor';
import { error, redirect } from '@sveltejs/kit';
import { parseJson, isValidUrl } from '$lib/utils';
import { APP_URL } from '$lib/vars/public';
import ENV from '$lib/vars/private';
const { DEBUG, PRIVATE_ENCRYPT_KEY = null } = ENV;

export const load = async (event: ServerLoadEvent) => {
	const { url, route, cookies, request, setHeaders } = event;
	const path: string[] = url.pathname.split('/').filter((f) => !!f);
	if (DEBUG) console.log('load path:', path);

	const result: Record<string, string | string[] | number | boolean | object> = {
		text: '',
		passRequired: false,
		redirectlink: false
	};

	if (path?.length > 0) {
		const encryptor = createEncryptor(PRIVATE_ENCRYPT_KEY);
		const decrypted = encryptor.decrypt(path.join('/'));
		if (DEBUG) console.log('load decrypted:', decrypted);
		if (!decrypted?.text) {
			return error(400, { message: 'Bad data' });
		}
		let { expires, password, redirectlink, text, uid } = decrypted;
		if (expires > 0 && expires < Date.now()) {
			return error(401, { message: 'Expired' });
		}
		if (!!password) {
			result.passRequired = true;
		} else if (!!text) {
			result.text = text;
		}
		result.redirectlink = !!redirectlink;
		if (isValidUrl(result.text) && result.redirectlink) {
			return redirect(307, result.text);
		}
	} else {
		return error(404, { message: 'Not found' });
	}

	setHeaders({
		'Cross-Origin-Opener-Policy': 'same-origin',
		'Cross-Origin-Embedder-Policy': 'require-corp'
	});

	return result;
};
