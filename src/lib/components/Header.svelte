<script lang="ts">
	const title = __TITLE__;
	const description = __DESC__;
	const homepage = __HOMEPAGE__;
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<noscript>You need to enable JavaScript to run this app.</noscript>
	<script src="https://cdn.jsdelivr.net/npm/fingerprintjs2@2.1.4/dist/fingerprint2.min.js"></script>
</svelte:head>

<div class="mt-auto">
	<div class="flex flex-wrap items-center justify-left text-neutral-50/20 gap-4 py-4">
		<a href="/" {title}>home</a> | <a href="https://denotes.ru" title="denotes.ru">denotes.ru</a>
	</div>
</div>

<div class="mt-auto">
	<div class="flex flex-wrap items-center justify-left gap-4 py-4">
		<h1 class="text-3xl">
			<a href="/" {title}>{title}</a>
		</h1>
	</div>
</div>
