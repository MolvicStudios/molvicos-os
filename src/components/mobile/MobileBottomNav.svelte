<script>
	import { createEventDispatcher } from 'svelte';
	import { getDockApps, getApp } from '$lib/apps.js';
	import { t } from '$lib/i18n/index.js';

	export let activeApp = null;

	const dispatch = createEventDispatcher();

	const SETTINGS = getApp('settings');

	// First 3 core dock apps (exclude settings/appstore which are fixed)
	const quickApps = getDockApps()
		.filter((a) => a.id !== 'settings' && a.id !== 'appstore')
		.slice(0, 3);

	function goHome() {
		dispatch('home');
	}

	function open(app) {
		dispatch('open', app);
	}
</script>

<nav class="m-bottomnav" aria-label="Main navigation">
	<!-- Home -->
	<button
		class="m-nav-btn home-btn"
		class:active={!activeApp}
		on:click={goHome}
		aria-label="Home"
	>
		<span class="m-nav-icon home-icon">◈</span>
		<span class="m-nav-label">Home</span>
	</button>

	<!-- Quick launch apps -->
	{#each quickApps as app (app.id)}
		<button
			class="m-nav-btn {app.colorClass}"
			class:active={activeApp?.id === app.id}
			on:click={() => open(app)}
			aria-label={$t(`apps.${app.id}.name`)}
		>
			<span class="m-nav-icon">{app.emoji}</span>
			<span class="m-nav-label">{$t(`apps.${app.id}.name`)}</span>
		</button>
	{/each}

	<!-- Settings -->
	{#if SETTINGS}
		<button
			class="m-nav-btn"
			class:active={activeApp?.id === 'settings'}
			on:click={() => open(SETTINGS)}
			aria-label={$t('apps.settings.name')}
		>
			<span class="m-nav-icon">{SETTINGS.emoji}</span>
			<span class="m-nav-label">{$t('apps.settings.name')}</span>
		</button>
	{/if}
</nav>

<style>
	.m-bottomnav {
		height: 64px;
		display: flex;
		align-items: stretch;
		background: color-mix(in srgb, var(--bg-surface) 90%, transparent);
		backdrop-filter: blur(20px);
		border-top: 1px solid var(--border-accent);
		flex-shrink: 0;
		z-index: 100;
		padding: 0 4px;
		padding-bottom: env(safe-area-inset-bottom, 0);
	}

	.m-nav-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		background: none;
		border: none;
		cursor: pointer;
		border-radius: var(--radius-md);
		transition: all 0.15s ease;
		-webkit-tap-highlight-color: transparent;
		padding: 6px 2px;
		position: relative;
	}

	.m-nav-btn:active {
		background: var(--accent-dim);
		transform: scale(0.92);
	}

	.m-nav-btn.active::after {
		content: '';
		position: absolute;
		bottom: 4px;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--accent);
	}

	.m-nav-icon {
		font-size: 20px;
		line-height: 1;
	}

	.home-icon {
		color: var(--accent);
		font-family: var(--font-display, 'Syne', sans-serif);
		font-size: 18px;
	}

	.m-nav-btn.active .m-nav-icon {
		filter: drop-shadow(0 0 4px var(--accent-glow, #00ff8840));
	}

	.m-nav-label {
		font-family: var(--font-mono);
		font-size: 9px;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	.m-nav-btn.active .m-nav-label {
		color: var(--accent);
	}
</style>
