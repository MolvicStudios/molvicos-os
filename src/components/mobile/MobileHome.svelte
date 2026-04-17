<script>
	import { APPS } from '$lib/apps.js';
	import { t } from '$lib/i18n/index.js';
	import { createEventDispatcher } from 'svelte';
	import { fly } from 'svelte/transition';
	import { mobileFeaturedConfig } from '$lib/stores/mobile.js';

	const dispatch = createEventDispatcher();

	const sections = [
		{ key: 'core', label: 'Core' },
		{ key: 'tools', label: 'Tools' },
		{ key: 'power', label: 'System' }
	];

	$: featuredIds = $mobileFeaturedConfig;
	$: featured = featuredIds.map((id) => APPS.find((a) => a.id === id)).filter(Boolean);

	function getBySection(key) {
		return APPS.filter((a) => a.section === key && a.status === 'active' && !featuredIds.includes(a.id));
	}

	function open(app) {
		dispatch('open', app);
	}
</script>

<div class="m-home" in:fly={{ y: 12, duration: 200 }}>

	<!-- Featured Cards -->
	<div class="featured-row">
		{#each featured as app (app.id)}
			<button class="featured-card {app.colorClass}" on:click={() => open(app)}>
				<div class="fc-icon">{app.emoji}</div>
				<div class="fc-text">
					<span class="fc-name">{$t(`apps.${app.id}.name`)}</span>
					<span class="fc-desc">{$t(`apps.${app.id}.desc`)}</span>
				</div>
			</button>
		{/each}
	</div>

	<!-- Sections as horizontal scroll rows -->
	{#each sections as sec}
		{@const apps = getBySection(sec.key)}
		{#if apps.length > 0}
			<div class="m-section">
				<h2 class="m-section-title">{sec.label}</h2>
				<div class="m-carousel">
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

	<div class="m-footer-space"></div>
</div>

<style>
	.m-home {
		height: 100%;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		padding: 14px 0 8px;
		scrollbar-width: none;
	}

	.m-home::-webkit-scrollbar {
		display: none;
	}

	/* ── Featured row ── */
	.featured-row {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 0 12px 20px;
	}

	.featured-card {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 16px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg, 14px);
		cursor: pointer;
		text-align: left;
		transition: all 0.15s ease;
		-webkit-tap-highlight-color: transparent;
		width: 100%;
	}

	.featured-card:active {
		border-color: var(--accent-border);
		background: color-mix(in srgb, var(--bg-elevated) 85%, var(--accent) 15%);
		transform: scale(0.98);
	}

	.fc-icon {
		font-size: 30px;
		width: 52px;
		height: 52px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 12px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		flex-shrink: 0;
	}

	.fc-text {
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}

	.fc-name {
		font-family: var(--font-display, 'Syne', sans-serif);
		font-size: 14px;
		font-weight: 700;
		color: var(--text-primary);
	}

	.fc-desc {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* ── Section rows ── */
	.m-section {
		margin-bottom: 20px;
	}

	.m-section-title {
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 2px;
		color: var(--accent);
		margin: 0 0 10px 16px;
	}

	.m-carousel {
		display: flex;
		gap: 10px;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
		padding: 4px 12px 8px;
	}

	.m-carousel::-webkit-scrollbar {
		display: none;
	}

	.m-app-tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 8px 4px;
		background: none;
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.15s ease;
		-webkit-tap-highlight-color: transparent;
		flex-shrink: 0;
		width: 68px;
	}

	.m-app-tile:active {
		background: var(--accent-dim);
		border-color: var(--accent-border);
		transform: scale(0.93);
	}

	.m-app-icon {
		width: 52px;
		height: 52px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 13px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		font-size: 24px;
		transition: border-color 0.15s ease;
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
		width: 100%;
	}

	.m-footer-space {
		height: 12px;
	}
</style>
