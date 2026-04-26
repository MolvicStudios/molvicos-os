<script>
	import { createEventDispatcher } from 'svelte';
	import { t } from '$lib/i18n/index.js';

	export let id;
	export let label = '';
	export let sublabel = '';
	export let emoji = '📦';
	export let colorClass = '';
	export let badge = '';
	export let locked = false;
	export let status = 'active';

	const dispatch = createEventDispatcher();

	let clickTimeout;

	function handleClick() {
		if (clickTimeout) {
			clearTimeout(clickTimeout);
			clickTimeout = null;
			dispatch('open', { id });
		} else {
			clickTimeout = setTimeout(() => {
				clickTimeout = null;
				dispatch('select', { id });
			}, 300);
		}
	}
</script>

<button class="app-icon" on:click={handleClick} title={label}>
	<div class="icon-box {colorClass}">
		<span class="icon-emoji">{emoji}</span>
		{#if badge}
			<span class="icon-badge">{badge}</span>
		{/if}
		{#if locked}
			<span class="icon-lock">🔒</span>
		{/if}
	</div>
	<span class="icon-label">{label}</span>
	{#if sublabel}
		<span class="icon-sublabel">{sublabel}</span>
	{/if}
</button>

<style>
	.app-icon {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 4px;
		cursor: pointer;
		transition: transform var(--transition);
		background: none;
		border: none;
		color: inherit;
	}

	.app-icon:hover {
		transform: scale(1.05);
	}

	.app-icon:active {
		transform: scale(0.95);
	}

	.icon-box {
		position: relative;
		width: 60px;
		height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-md);
		border: 1px solid;
		transition: all var(--transition);
	}

	.icon-box:hover {
		box-shadow: 0 0 16px var(--accent-glow);
	}

	.icon-emoji {
		font-size: 24px;
		line-height: 1;
	}

	.icon-badge {
		position: absolute;
		top: -4px;
		right: -4px;
		font-size: 10px;
		color: var(--warning);
	}

	.icon-lock {
		position: absolute;
		bottom: -2px;
		right: -2px;
		font-size: 10px;
	}

	.icon-label {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--text-primary);
		text-align: center;
		max-width: 72px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.icon-sublabel {
		font-family: var(--font-mono);
		font-size: 9px;
		color: var(--text-secondary);
		text-align: center;
	}
</style>
