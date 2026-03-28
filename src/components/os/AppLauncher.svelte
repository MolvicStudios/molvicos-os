<script>
	import { createEventDispatcher } from 'svelte';
	import { APPS } from '$lib/apps.js';
	import { openApp } from '$lib/stores/os.js';
	import { t } from '$lib/i18n/index.js';
	import { fade } from 'svelte/transition';

	export let open = false;

	const dispatch = createEventDispatcher();

	async function launch(app) {
		await openApp({ ...app, title: $t(`apps.${app.id}.name`) });
		dispatch('close');
	}

	function handleBackdrop() {
		dispatch('close');
	}

	function handleKeydown(e) {
		if (e.key === 'Escape') dispatch('close');
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="launcher-backdrop" transition:fade={{ duration: 150 }} on:click={handleBackdrop} role="presentation">
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div class="launcher-panel" on:click|stopPropagation role="dialog" aria-label="App Launcher">
			<div class="launcher-title">
				<span class="lt-icon">◈</span>
				<span class="lt-text">{$t('os.openApp') || 'Apps'}</span>
			</div>
			<div class="launcher-grid">
				{#each APPS as app (app.id)}
					<button class="launcher-item" on:click={() => launch(app)} title={$t(`apps.${app.id}.name`)}>
						<div class="li-icon {app.colorClass}">
							<span class="li-emoji">{app.emoji}</span>
						</div>
						<span class="li-name">{$t(`apps.${app.id}.name`)}</span>
						<span class="li-desc">{$t(`apps.${app.id}.desc`)}</span>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.launcher-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9000;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(12px);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.launcher-panel {
		background: color-mix(in srgb, var(--bg-surface) 92%, transparent);
		border: 1px solid var(--border-accent);
		border-radius: var(--radius-xl);
		padding: 24px 28px;
		max-width: 600px;
		width: 90vw;
		max-height: 80vh;
		overflow-y: auto;
		scrollbar-width: none;
	}

	.launcher-panel::-webkit-scrollbar { display: none; }

	.launcher-title {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 20px;
	}

	.lt-icon {
		font-size: 18px;
		color: var(--accent);
	}

	.lt-text {
		font-family: var(--font-display);
		font-size: 15px;
		color: var(--text-primary);
		letter-spacing: 1px;
	}

	.launcher-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 12px;
	}

	.launcher-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 14px 8px;
		border-radius: var(--radius-md);
		background: none;
		border: 1px solid transparent;
		cursor: pointer;
		font-family: var(--font-mono);
		transition: all 0.15s ease;
	}

	.launcher-item:hover {
		background: var(--accent-dim);
		border-color: var(--accent-border);
	}

	.li-icon {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-md);
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		font-size: 22px;
	}

	.li-emoji {
		font-size: 22px;
	}

	.li-name {
		font-size: 11px;
		color: var(--text-primary);
		text-align: center;
		line-height: 1.2;
	}

	.li-desc {
		font-size: 9px;
		color: var(--text-secondary);
		text-align: center;
		line-height: 1.2;
		max-width: 90px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (max-width: 480px) {
		.launcher-grid {
			grid-template-columns: repeat(3, 1fr);
			gap: 8px;
		}
		.launcher-panel {
			padding: 16px;
		}
	}
</style>
