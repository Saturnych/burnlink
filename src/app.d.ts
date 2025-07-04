// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
	declare const __NAME__: string;
	declare const __TITLE__: string;
	declare const __DESC__: string;
	declare const __HOMEPAGE__: string;
	declare const __REPO__: string;
	declare const __AUTHORNAME__: string;
	declare const __AUTHOREMAIL__: string;
}

export {};
