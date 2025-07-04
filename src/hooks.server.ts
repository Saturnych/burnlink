import type { Handle } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import ENV from '$lib/vars/private';

export const addHeaders: Handle = async ({ event, resolve }) => {
	//const { url } = event;
	//if (url.pathname.includes('.well-known')) { // '/.well-known/appspecific/com.chrome.devtools.json'
	//	return error(404, { message: 'Not found' });
	//}
	const response = await resolve(event);
	//response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
	//response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp'); // credentialless require-corp
	return response;
};

export const handle: Handle = sequence(addHeaders);
