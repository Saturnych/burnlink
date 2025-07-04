<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import LinkArea from '$lib/components/LinkArea.svelte';

	let value: string = $state('');
	let link: string = $state('');
</script>

<Header />
<LinkArea {value} {link} />
