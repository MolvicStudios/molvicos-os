<script>
	import { theme } from '$lib/stores/os.js';
	import { storage } from '$lib/storage/local.js';

	function toggle() {
		theme.update((t) => {
			const next = t === 'noir' ? 'icaro' : 'noir';
			document.documentElement.setAttribute('data-theme', next);
			storage.setTheme(next);
			return next;
		});
	}
</script>

<button class="theme-toggle" on:click={toggle} title="Toggle theme">
	{#if $theme === 'noir'}
		<span class="theme-icon">☀️</span>
	{:else}
		<span class="theme-icon">🌙</span>
	{/if}
</button>

<style>
	.theme-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 6px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		cursor: pointer;
		transition: all var(--transition);
	}

	.theme-toggle:hover {
		border-color: var(--border-accent);
	}

	.theme-icon {
		font-size: 12px;
		line-height: 1;
	}
</style>
