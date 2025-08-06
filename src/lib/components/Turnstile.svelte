<script lang="ts">
	import { DEBUG, TURNSTILE_SITEKEY } from '$lib/vars/public';

	$effect(async () => {
		const getTurnstile = () => {
			if (turnstile && 'render' in turnstile) {
				turnstile.render('#turnstile', {
					sitekey,
					callback: (token) => {
						console.log(`Challenge Success ${token}`);
					}
				});
			}
		};

		if (window.requestIdleCallback) {
			window.requestIdleCallback(() => delay(getTurnstile, 500));
		} else {
			delay(getTurnstile, 500);
		}
	});
</script>

<svelte:head>
	<script src="https://challenges.cloudflare.com/turnstile/v0/api.js"></script>
	<script>
		const turnstileCallback = (token) => {
			console.log('turnstile token:', token);
		};
	</script>
</svelte:head>

<div
	id="turnstile"
	class="cf-turnstile"
	data-sitekey={TURNSTILE_SITEKEY}
	data-callback="turnstileCallback"
></div>
