<script>
	import { createEventDispatcher } from 'svelte';
	import { getApp } from '$lib/apps.js';
	import { t } from '$lib/i18n/index.js';
	import { mobileNavConfig } from '$lib/stores/mobile.js';

	export let activeApp = null;

	const dispatch = createEventDispatcher();

	const SETTINGS = getApp('settings');

	// Quick apps from configurable store (max 3, exclude settings)
	$: quickApps = $mobileNavConfig
		.filter((id) => id !== 'settings')
		.slice(0, 3)
		.map((id) => getApp(id))
		.filter(Boolean);

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
		class="m-nav-btn"
		class:active={!activeApp}
		on:click={goHome}
		aria-label="Home"
	>
		{#if !activeApp}
			<span class="active-bar"></span>
		{/if}
		<span class="m-nav-icon home-icon">◈</span>
		<span class="m-nav-label" class:visible={!activeApp}>Home</span>
	</button>

	<!-- Quick launch apps -->
	{#each quickApps as app (app.id)}
		{@const isActive = activeApp?.id === app.id}
		<button
			class="m-nav-btn"
			class:active={isActive}
			on:click={() => open(app)}
			aria-label={$t(`apps.${app.id}.name`)}
		>
			{#if isActive}
				<span class="active-bar"></span>
			{/if}
			<span class="m-nav-icon">{app.emoji}</span>
			<span class="m-nav-label" class:visible={isActive}>{$t(`apps.${app.id}.name`)}</span>
		</button>
	{/each}

	<!-- Settings -->
	{#if SETTINGS}
		{@const isActive = activeApp?.id === 'settings'}
		<button
			class="m-nav-btn"
			class:active={isActive}
			on:click={() => open(SETTINGS)}
			aria-label={$t('apps.settings.name')}
		>
			{#if isActive}
				<span class="active-bar"></span>
			{/if}
			<span class="m-nav-icon">{SETTINGS.emoji}</span>
			<span class="m-nav-label" class:visible={isActive}>{$t('apps.settings.name')}</span>
		</button>
	{/if}
</nav>

<style>
	.m-bottomnav {
		height: 60px;
		display: flex;
		align-items: stretch;
		background: color-mix(in srgb, var(--bg-surface) 92%, transparent);
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
		gap: 2px;
		background: none;
		border: none;
		cursor: pointer;
		border-radius: 0;
		transition: all 0.15s ease;
		-webkit-tap-highlight-color: transparent;
		padding: 4px 2px 6px;
		position: relative;
		overflow: hidden;
	}

	.m-nav-btn:active {
		background: var(--accent-dim);
		transform: scale(0.9);
	}

	/* Top line indicator for active tab */
	.active-bar {
		position: absolute;
		top: 0;
		left: 20%;
		right: 20%;
		height: 2px;
		border-radius: 0 0 2px 2px;
		background: var(--accent);
		box-shadow: 0 0 8px var(--accent-glow, #00ff8860);
	}

	.m-nav-icon {
		font-size: 20px;
		line-height: 1;
		transition: transform 0.15s ease;
	}

	.home-icon {
		color: var(--accent);
		font-family: var(--font-display, 'Syne', sans-serif);
		font-size: 17px;
	}

	.m-nav-btn.active .m-nav-icon {
		transform: scale(1.1);
		filter: drop-shadow(0 0 4px var(--accent-glow, #00ff8840));
	}

	/* Labels only visible when active */
	.m-nav-label {
		font-family: var(--font-mono);
		font-size: 9px;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
		max-height: 0;
		opacity: 0;
		transition: max-height 0.15s ease, opacity 0.15s ease;
	}

	.m-nav-label.visible {
		max-height: 14px;
		opacity: 1;
		color: var(--accent);
	}
</style>
