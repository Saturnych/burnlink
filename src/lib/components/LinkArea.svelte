<script lang="ts">
	import Icon from '@iconify/svelte';
	import { copy, copyText } from 'svelte-copy';
	import { Debounced } from 'runed';
	import { alertId, uid } from '$lib/stores';
	import { isValidUrl, normalize, postForm, sleep } from '$lib/utils';
	import { DEBUG, LINK_URI } from '$lib/vars/public';
	import Alert from '$lib/components/Alert.svelte';

	const repository = __REPO__;

	let {
		text = $bindable(''),
		password = $bindable(''),
		expiry = $bindable(0),
		redirectlink = $bindable(false),
		link = $bindable(''),
		alertMessage = $bindable()
	} = $props();
	const texted = new Debounced(() => text.trim(), 10);
	const passworded = new Debounced(() => password.trim(), 10);
	let hasLink: boolean = $derived(normalize(link)?.length > 0);
	let hasText: boolean = $derived(normalize(texted.current)?.length > 0);
	let hasPassword: boolean = $derived(normalize(passworded.current)?.length > 0);
	let overPassword: boolean = $state(false);
	let placeholder = 'input text & click the "done" checkmark';

	const states: Record<string, object> = {
		text: {
			default: '',
			before: ''
		},
		password: {
			default: '',
			before: ''
		},
		expiry: {
			default: 0,
			before: 0
		},
		redirectlink: {
			default: false,
			before: false
		},
		link: {
			default: '',
			before: ''
		}
	};

	const copyStates = (): void => {
		states.text.before = `${text}`;
		states.password.before = `${password}`;
		states.expiry.before = Number(`${expiry}`);
		states.redirectlink.before = String(redirectlink) === 'true';
		states.link.before = `${link}`;
		document.getElementById('clearbutton')?.setAttribute('disabled', true);
	};

	const showPassword = (show: boolean = true): void => {
		if (show) document.getElementById('passwordinput')?.setAttribute('type', 'text');
		else document.getElementById('passwordinput')?.setAttribute('type', 'password');
	};

	const clearPassword = (): void => {
		password = states.password.default;
	};

	const clearExipry = (): void => {
		expiry = states.expiry.default;
	};

	const clearRedirect = (): void => {
		redirectlink = states.redirectlink.default;
	};

	const clearLink = (): void => {
		document.getElementById('getbutton')?.setAttribute('disabled', true);
		document.getElementById('copybutton')?.setAttribute('disabled', true);
		document.getElementById('openbutton')?.setAttribute('disabled', true);
		link = states.link.default;
		copyStates();
	};

	const clearText = (): void => {
		text = states.text.default;
		clearPassword();
		clearRedirect();
		clearExipry();
		clearLink();
	};

	const getLink = async (): void => {
		await sleep(50);
		copyStates();
		if (hasText) {
			const result = await postForm(
				{
					uid: uid.get(),
					text: texted.current,
					password: passworded.current,
					expiry,
					redirectlink: isValidUrl(texted.current) && redirectlink
				},
				LINK_URI
			);
			if (DEBUG) console.log('getLink() attempts:', result?.data?.attempts);
			if (!!result?.data?.link) {
				link = result?.data?.link;
				states.link.before = `${link.trim()}`;
				alertId.update('linkCreated');
				await sleep(50);
				document.getElementById('copybutton')?.removeAttribute('disabled');
				document.getElementById('openbutton')?.removeAttribute('disabled');
				document.getElementById('getbutton')?.removeAttribute('disabled');
				document.getElementById('clearbutton')?.removeAttribute('disabled');
			}
		} else {
			document.getElementById('getbutton')?.setAttribute('disabled', true);
			alertId.update('getLinkError');
		}
	};
</script>

<Alert bind:alertMessage />

<div class="mb-8">
	<div class="mt-6 flex flex-col items-start justify-between gap-9 sm:flex-row">
		<div>
			<h2 class="text-2xl"><nobr>Paste text:</nobr></h2>
			<div class="mt-6 text-l underline">
				<a
					href="#"
					onclick={() => {
						text = repository;
						redirectlink = true;
						expiry = 1;
						getLink();
						return false;
					}}
				>
					Show example
				</a>
			</div>
		</div>
		<div
			class="relative flex w-full items-left rounded-sm bg-gray-300 dark:bg-neutral-800/60 px-3 pr-7 ring-orange-500 focus-within:ring-2 focus-visible:outline-none focus-visible:ring-2 sm:w-fit"
		>
			<button
				disabled
				onclick={() => getLink()}
				id="getbutton"
				title="Get the sharing link"
				class="text-xl text-neutral-600 hover:text-neutral-500 focus:outline-none"
			>
				<Icon icon="ic:sharp-done" />
			</button>
			<textarea
				bind:value={text}
				oninput={() => {
					document.getElementById('getbutton')?.setAttribute('disabled', true);
				}}
				onchange={(evt) => {
					if (evt.target.value !== states.text.before) {
						if (hasText) {
							getLink();
						} else {
							clearLink();
						}
					}
				}}
				rows="4"
				cols="80"
				aria-label={placeholder}
				{placeholder}
				name="text"
				class={`w-full bg-transparent py-2 px-3 placeholder:text-neutral-600 focus:outline-none focus-visible:outline-none`}
			></textarea>
			{#if hasText}
				<button
					onclick={() => clearText()}
					id="clearbutton"
					title="Clear text field"
					class="absolute top-[50%] right-3 flex translate-y-[-50%] items-center justify-center text-xl text-neutral-600 hover:text-neutral-500 focus:outline-none"
				>
					<Icon icon="ic:sharp-clear" />
				</button>
			{/if}
		</div>
	</div>

	<div class="mt-6 flex flex-col items-start justify-between gap-9 sm:flex-row">
		<div>
			<h2 class="text-l"><nobr>Optional redirect:</nobr></h2>
		</div>
		<div
			class="relative flex w-full items-left rounded-sm bg-gray-300 dark:bg-neutral-800/60 ml-3 px-3 py-2 ring-orange-500 focus-within:ring-2 focus-visible:outline-none focus-visible:ring-2 sm:w-fit"
		>
			<input
				type="checkbox"
				bind:checked={redirectlink}
				onchange={(evt) => {
					if (hasText) {
						getLink();
					} else {
						clearLink();
					}
				}}
				title="Redirect to result URL"
				class={`h-6 w-6 shrink-0 bg-white dark:bg-neutral-800/60 checked:accent-gray-100 checked:dark:accent-gray-600`}
			/>
		</div>
		<div class="relative flex w-full py-2 px-1">
			Checked => auto redirect to result if the secret is URL
		</div>
	</div>

	<div class="mt-6 flex flex-col items-start justify-between gap-9 sm:flex-row">
		<div>
			<h2 class="text-l"><nobr>Optional password:</nobr></h2>
		</div>
		<div
			class="relative flex w-full items-left rounded-sm bg-gray-300 dark:bg-neutral-800/60 px-4 ring-orange-500 focus-within:ring-2 focus-visible:outline-none focus-visible:ring-2 sm:w-fit"
		>
			<button
				onclick={() => {
					clearPassword();
					if (hasText) {
						getLink();
					} else {
						clearLink();
					}
				}}
				title="Clear password"
				class="text-xl text-neutral-600 hover:text-neutral-500 focus:outline-none"
			>
				<Icon icon="ic:sharp-clear" />
			</button>
			<input
				type="password"
				id="passwordinput"
				bind:value={password}
				onchange={(evt) => {
					if (evt.target.value !== states.password.before) {
						if (hasText) {
							getLink();
						} else {
							clearLink();
						}
					}
				}}
				class={`py-2 px-2 bg-transparent focus:outline-none focus-visible:outline-none`}
			/>
			{#if hasPassword}
				<button
					onmousedown={() => {
						showPassword();
						if (password !== states.password.before) {
							if (hasText) {
								getLink();
							} else {
								clearLink();
							}
						}
					}}
					onmouseup={() => showPassword(false)}
					onmouseover={() => {
						overPassword = true;
					}}
					onfocus={() => {
						overPassword = true;
					}}
					onmouseout={() => {
						overPassword = false;
						showPassword(overPassword);
					}}
					onblur={() => {
						overPassword = false;
						showPassword(overPassword);
					}}
					onmouseleave={() => {
						overPassword = false;
						showPassword(overPassword);
					}}
					title="Show Password"
					class="absolute top-[50%] right-3 flex translate-y-[-50%] items-center justify-center text-xl text-neutral-600 hover:text-neutral-500 focus:outline-none"
				>
					<Icon icon="mdi:eye" />
				</button>
			{/if}
		</div>
		<div class="relative flex w-full py-2 px-1">Empty => no password required to access</div>
	</div>

	<div class="mt-6 flex flex-col items-start justify-between gap-9 sm:flex-row">
		<div>
			<h2 class="text-l"><nobr>Hours till expiration:</nobr></h2>
		</div>
		<div
			class="relative flex w-full items-left rounded-sm bg-gray-300 dark:bg-neutral-800/60 px-3 ring-orange-500 focus-within:ring-2 focus-visible:outline-none focus-visible:ring-2 sm:w-fit"
		>
			<button
				onclick={() => {
					clearExipry();
					if (hasText) {
						getLink();
					} else {
						clearLink();
					}
				}}
				title="Clear expiry days"
				class="text-xl text-neutral-600 hover:text-neutral-500 focus:outline-none"
			>
				<Icon icon="ic:sharp-clear" />
			</button>
			<input
				type="number"
				bind:value={expiry}
				min="0"
				placeholder=""
				onchange={(evt) => {
					if (evt.target.value !== states.expiry.before) {
						if (hasText) {
							getLink();
						} else {
							clearLink();
						}
					}
				}}
				class={`py-2 px-2 bg-transparent focus:outline-none focus-visible:outline-none`}
			/>
		</div>
		<div class="relative flex w-full py-2 px-1">0 => no time to live limit</div>
	</div>

	<div class="mt-6 flex flex-col items-start justify-between gap-9 sm:flex-row">
		<div>
			<h2 class="text-2xl"><nobr>Result link:</nobr></h2>
		</div>
		<div
			class="relative flex w-full items-left rounded-sm bg-gray-300 dark:bg-neutral-800/60 px-3 pr-7 ring-orange-500 focus-within:ring-2 focus-visible:outline-none focus-visible:ring-2 sm:w-fit"
		>
			<button
				disabled
				use:copy={{
					text: link,
					events: ['click'],
					onCopy({ text, event }) {
						alertId.update('linkCopied');
						//if (DEBUG) console.log(`Triggered by:`, event);
					},
					onError({ error, event }) {
						if (DEBUG) console.error(error);
					}
				}}
				id="copybutton"
				title="Copy to clipboard"
				class="text-xl text-neutral-600 hover:text-neutral-500 focus:outline-none"
			>
				<Icon icon="mdi:export" />
			</button>
			<textarea
				disabled
				bind:value={link}
				rows="6"
				cols="80"
				title="Result link"
				class={`w-full bg-transparent py-2 px-3 placeholder:text-neutral-600 focus:outline-none focus-visible:outline-none`}
			></textarea>
			{#if hasLink}
				<button
					onclick={() => {
						if (!!link) {
							alertId.update('');
							window.open(link, '_blank');
						}
					}}
					id="openbutton"
					title="Open link"
					class="absolute top-[50%] right-3 flex translate-y-[-50%] items-center justify-center text-xl text-neutral-600 hover:text-neutral-500 focus:outline-none"
				>
					<Icon icon="mdi:arrow-right" />
				</button>
			{/if}
		</div>
	</div>
</div>
