<script>
	import { APPS } from '$lib/apps.js';
	import { t } from '$lib/i18n/index.js';
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';

	const dispatch = createEventDispatcher();

	const sections = [
		{ key: 'core', label: 'Core Apps' },
		{ key: 'tools', label: 'Tools' },
		{ key: 'power', label: 'System' }
	];

	function getBySection(key) {
		return APPS.filter((a) => a.section === key && a.status === 'active');
	}

	function open(app) {
		dispatch('open', app);
	}
</script>

<div class="m-home" in:fade={{ duration: 150 }}>
	{#each sections as sec}
		{@const apps = getBySection(sec.key)}
		{#if apps.length > 0}
			<div class="m-section">
				<h2 class="m-section-title">{sec.label}</h2>
				<div class="m-app-grid">
					{#each apps as app (app.id)}
						<button class="m-app-tile" on:click={() => open(app)}>
							<div class="m-app-icon {app.colorClass}">
								<span>{app.emoji}</span>
							</div>
							<span class="m-app-name">{$t(`apps.${app.id}.name`)}</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	{/each}
</div>

<style>
	.m-home {
		height: 100%;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		padding: 16px 12px 8px;
		scrollbar-width: none;
	}

	.m-home::-webkit-scrollbar {
		display: none;
	}

	.m-section {
		margin-bottom: 24px;
	}

	.m-section-title {
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 2px;
		color: var(--accent);
		margin: 0 0 12px 4px;
	}

	.m-app-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 10px;
	}

	@media (min-width: 480px) {
		.m-app-grid {
			grid-template-columns: repeat(5, 1fr);
		}
	}

	@media (min-width: 768px) {
		.m-app-grid {
			grid-template-columns: repeat(6, 1fr);
			gap: 14px;
		}
	}

	.m-app-tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 10px 4px;
		background: none;
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.15s ease;
		-webkit-tap-highlight-color: transparent;
	}

	.m-app-tile:active {
		background: var(--accent-dim);
		border-color: var(--accent-border);
		transform: scale(0.95);
	}

	.m-app-icon {
		width: 52px;
		height: 52px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 14px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		font-size: 24px;
		transition: all 0.15s ease;
	}

	.m-app-tile:active .m-app-icon {
		border-color: var(--accent-border);
		box-shadow: 0 0 10px var(--accent-glow, #00ff8830);
	}

	.m-app-name {
		font-family: var(--font-mono);
		font-size: 9px;
		color: var(--text-secondary);
		text-align: center;
		line-height: 1.3;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		max-width: 64px;
	}
</style>
