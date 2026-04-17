<script>
	export let component;
	export let slideDir = 1; // 1 = from right (open), -1 = from left (back)

	import { fly } from 'svelte/transition';
</script>

<div
	class="m-appview"
	in:fly={{ x: slideDir * 80, duration: 240, opacity: 0 }}
	out:fly={{ x: slideDir * -80, duration: 200, opacity: 0 }}
>
	<div class="m-app-inner">
		<svelte:component this={component} />
	</div>
</div>

<style>
	.m-appview {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		background: var(--bg-surface);
		overflow: hidden;
	}

	/* Touch-friendly CSS overrides for all child app components */
	.m-app-inner {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		/* Enlarge tap targets and text globally */
		--input-height: 44px;
		--btn-min-height: 44px;
		--font-size-base: 14px;
		--radius-md: 10px;
		--radius-lg: 14px;
		font-size: var(--font-size-base);
	}

	/* Make buttons bigger for touch without modifying app components */
	.m-app-inner :global(button:not([class*="icon"])) {
		min-height: var(--btn-min-height);
		touch-action: manipulation;
	}

	/* Inputs: prevent iOS auto-zoom (needs 16px+) */
	.m-app-inner :global(input),
	.m-app-inner :global(textarea),
	.m-app-inner :global(select) {
		font-size: 16px !important;
		min-height: var(--input-height);
		touch-action: manipulation;
	}

	/* Remove tiny close/drag controls not useful on mobile */
	.m-app-inner :global(.window-controls),
	.m-app-inner :global(.titlebar-drag) {
		display: none !important;
	}

	/* Ensure scrollable panels inside apps work on iOS */
	.m-app-inner :global([class*="scroll"]),
	.m-app-inner :global([class*="-list"]),
	.m-app-inner :global([class*="-panel"]) {
		-webkit-overflow-scrolling: touch;
	}
</style>
