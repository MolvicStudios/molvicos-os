<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import { t } from '$lib/i18n/index.js';

	export let title = '';
	export let icon = '';
	export let credits = 0;
	export let result = '';
	export let history = null;
	export let onExport = null;
	export let onShare = null;
	export let onClear = null;

	const dispatch = createEventDispatcher();

	onMount(() => {
		const handler = (e) => {
			if (e.detail?.appId === title.toLowerCase().replace(/\s+/g, '')) {
				dispatch('miraprompt', e.detail.prompt);
			}
		};
		window.addEventListener('mira:prompt-suggestion', handler);
		return () => window.removeEventListener('mira:prompt-suggestion', handler);
	});
</script>

<div class="app-shell">
	<div class="app-topbar">
		<div class="app-topbar-left">
			<span class="app-icon-sm">{icon}</span>
			<span class="app-title">{title}</span>
			{#if credits > 0}
				<span class="credits-badge">⚡{credits} cr</span>
			{/if}
		</div>
		<div class="app-topbar-right">
			{#if result}
				{#if onExport}
					<button class="tb-btn" on:click={onExport} title="Export">⬇</button>
				{/if}
				{#if onShare}
					<button class="tb-btn" on:click={onShare} title="Share link">🔗</button>
				{/if}
			{/if}
			{#if history}
				<button class="tb-btn" on:click={() => dispatch('togglehistory')} title="History">🕐</button>
			{/if}
			{#if onClear}
				<button class="tb-btn" on:click={onClear} title="Clear">✕</button>
			{/if}
		</div>
	</div>
	<div class="app-body">
		<slot />
	</div>
</div>

<style>
	.app-shell {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
		font-family: var(--font-mono);
	}
	.app-topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 14px;
		height: 36px;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}
	.app-topbar-left {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.app-topbar-right {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.app-icon-sm {
		font-size: 14px;
	}
	.app-title {
		font-size: 12px;
		color: var(--text-primary);
		font-weight: 500;
	}
	.credits-badge {
		font-size: 10px;
		color: var(--accent);
		background: var(--bg-active);
		border: 1px solid var(--border);
		padding: 1px 6px;
		border-radius: var(--radius-sm);
	}
	.tb-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-secondary);
		font-size: 13px;
		padding: 4px 6px;
		border-radius: var(--radius-sm);
		transition: color var(--transition), background var(--transition);
	}
	.tb-btn:hover {
		color: var(--text-primary);
		background: var(--bg-elevated);
	}
	.app-body {
		flex: 1;
		overflow: auto;
		padding: 16px;
	}
</style>
