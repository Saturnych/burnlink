import type { ServerLoadEvent, RequestHandler, Response } from '@sveltejs/kit';
import { returnJson } from '$lib/utils';
import { generateToken } from '$lib/utils/auth';
import ENV from '$lib/vars/private';
const { DEBUG, PRIVATE_TOKEN_SECRET = null } = ENV;

const postHandler: RequestHandler = async (event: ServerLoadEvent): Promise<Response> => {
	const result: Record<string, string | string[] | number | boolean | object> = {
		error: null,
		token: null,
		user: null,
		attempts: 0
	};
	try {
		const { url, route, cookies, request } = event;
		let data: Record<string, string | string[] | number | boolean | object> = {
			test: DEBUG
		};
		const contentType: string = request.headers.get('content-type');
		if (
			contentType.includes('multipart/form-data') ||
			contentType.includes('application/x-www-form-urlencoded')
		) {
			const formData = await request.formData(); // .text() .formData() .json()
			data['uid'] = formData?.get('uid');
			data['email'] = formData?.get('email');
			data['test'] = String(formData?.get('test')) === 'true' ? true : data['test'];
		} else {
			data = Object.assign(data, await request.json());
			data['test'] = String(data['test']) === 'true' ? true : data['test'];
		}
		if (DEBUG) console.log('POST data:', data);

		const { email, uid } = data;
		if (!email && !uid) {
			result.error = 'No data!';
			throw new Error(result.error);
		}

		const { token, user } = generateToken({ email, uid });
		if (!!token && email === user.email && uid === user.uid) {
			result.token = token;
			result.user = user;
		}
		if (DEBUG) console.log('POST result:', result);

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
