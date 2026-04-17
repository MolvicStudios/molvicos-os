<script>
	import { fade } from 'svelte/transition';

	export let component;
</script>

<div class="m-appview" in:fade={{ duration: 150 }}>
	<svelte:component this={component} />
</div>

<style>
	.m-appview {
		height: 100%;
		overflow: hidden;
		background: var(--bg-surface);
		display: flex;
		flex-direction: column;
	}
</style>
