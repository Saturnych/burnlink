<script lang="ts">
	import PasswordArea from '$lib/components/PasswordArea.svelte';

	let { data, password = $bindable('') } = $props();
	let { text = '', passRequired = false } = data;
</script>

<PasswordArea {text} {password} {passRequired} />
