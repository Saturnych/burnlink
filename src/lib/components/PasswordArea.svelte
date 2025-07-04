<script lang="ts">
	import Icon from '@iconify/svelte';
	import { copy, copyText } from 'svelte-copy';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { alertId, uid } from '$lib/stores';
	import { isValidUrl, normalize, postForm } from '$lib/utils';
	import { DEBUG, APP_URL, LINK_URI } from '$lib/vars/public';
	import Alert from '$lib/components/Alert.svelte';

	const path: string[] = page.url.pathname.split('/').filter((f) => !!f);

	let {
		text = $bindable(''),
		password = $bindable(''),
		passRequired = $bindable(false),
		alertMessage = $bindable()
	} = $props();

	const clearPassword = (): void => {
		password = '';
	};

	const getLink = async (cancel?: Function): void => {
		if (path?.length > 0) {
			const result = await postForm(
				{ uid: uid.get(), link: `${APP_URL}/${path.join('/')}`, password },
				LINK_URI
			);
			if (result?.data) {
				if (!!result.data.error) {
					alertMessage = result.data.error;
					alertId.update('error');
				} else {
					text = result.data.text;
					if (isValidUrl(text) && !!result.data.redirectlink) {
						window.open(text, '_self');
					} else {
						passRequired = false;
					}
				}
			}
		}
		cancel?.();
	};
</script>

<Alert bind:alertMessage />

<div class="mb-8">
	<div class="mt-6 flex flex-col items-start justify-between gap-7 sm:flex-row">
		<div>
			<h2 class="text-2xl">
				{#if passRequired}
					<nobr>Input password:</nobr>
				{:else}
					<nobr>Result:</nobr>
				{/if}
			</h2>
		</div>
		<div
			class="relative flex w-full items-left rounded-sm bg-gray-300 dark:bg-neutral-800/60 px-3 pr-7 ring-orange-500 focus-within:ring-2 focus-visible:outline-none focus-visible:ring-2 sm:w-fit"
		>
			{#if passRequired}
				<button
					onclick={() => getLink()}
					title="Get the result"
					class="text-xl text-neutral-600 hover:text-neutral-500 focus:outline-none"
				>
					<Icon icon="ic:sharp-done" />
				</button>
				<form use:enhance={({ cancel }) => getLink(cancel)} method="POST">
					<input
						type="password"
						bind:value={password}
						class={`w-full bg-transparent py-2 px-3 placeholder:text-neutral-600 focus:outline-none focus-visible:outline-none`}
						aria-label="input password"
						placeholder="input password"
					/>
				</form>
				<button
					onclick={() => clearPassword()}
					title="Clear password field"
					class="absolute top-[50%] right-3 flex translate-y-[-50%] items-center justify-center text-xl text-neutral-600 hover:text-neutral-500 focus:outline-none"
				>
					<Icon icon="ic:sharp-clear" />
				</button>
			{:else}
				<button
					title="Copy to clipboard"
					id="copybutton"
					use:copy={{
						text,
						events: ['click'],
						onCopy({ text, event }) {
							alertId.update('textCopied');
						},
						onError({ error, event }) {
							if (DEBUG) console.error(error);
						}
					}}
				>
					<Icon icon="mdi:export" class="text-xl text-neutral-600" />
				</button>
				<textarea
					disabled
					bind:value={text}
					rows="4"
					cols="80"
					class={`w-full bg-transparent py-2 px-3 placeholder:text-neutral-600 focus:outline-none focus-visible:outline-none`}
				></textarea>
				{#if isValidUrl(text)}
					<button
						title="Open link"
						class="absolute top-[50%] right-3 flex translate-y-[-50%] items-center justify-center text-xl text-neutral-600 hover:text-neutral-500 focus:outline-none"
						onclick={() => window.open(text, '_blank')}
					>
						<Icon icon="mdi:arrow-right" />
					</button>
				{/if}
			{/if}
		</div>
	</div>
</div>
