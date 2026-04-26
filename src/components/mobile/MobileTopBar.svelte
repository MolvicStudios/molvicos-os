<script>
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { t, currentLang, setLang, SUPPORTED_LANGS } from '$lib/i18n/index.js';
	import { theme } from '$lib/stores/os.js';
	import { fly } from 'svelte/transition';

	export let activeApp = null;

	const dispatch = createEventDispatcher();

	let menuOpen = false;
	let isOffline = false;

	const THEMES = ['noir', 'icaro', 'synthwave', 'matrix', 'forest'];

	function handleOnline() { isOffline = false; }
	function handleOffline() { isOffline = true; }

	function toggleMenu() { menuOpen = !menuOpen; }
	function closeMenu() { menuOpen = false; }

	function pickTheme(t) {
		theme.set(t);
		document.documentElement.setAttribute('data-theme', t);
		localStorage.setItem('ms_theme', t);
	}

	function pickLang(code) {
		setLang(code);
		closeMenu();
	}

	onMount(() => {
		isOffline = !navigator.onLine;
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);
	});

	onDestroy(() => {
		window.removeEventListener('online', handleOnline);
		window.removeEventListener('offline', handleOffline);
	});
</script>

{#if isOffline}
	<div class="offline-bar">📡 Offline — local models still available</div>
{/if}

<header class="m-topbar">
	{#if activeApp}
		<!-- App context: back + name only -->
		<button class="back-btn" on:click={() => dispatch('back')} aria-label="Back">
			<span class="back-arrow">‹</span>
			<span class="back-label">Home</span>
		</button>
		<div class="app-context">
			<span class="app-emoji">{activeApp.emoji}</span>
			<span class="app-name">{$t(`apps.${activeApp.id}.name`)}</span>
		</div>
		<div class="topbar-spacer"></div>
	{:else}
		<!-- Home context: logo + menu button -->
		<span class="logo"><span class="logo-mark">◈</span> MOLVICOS</span>
		<div class="topbar-spacer"></div>
		<button class="menu-btn" on:click={toggleMenu} aria-label="Menu" aria-expanded={menuOpen}>
			<span class="menu-dots">⋯</span>
		</button>
	{/if}
</header>

<!-- Dropdown menu (home only) -->
{#if menuOpen}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="menu-backdrop" on:click={closeMenu} role="presentation"></div>
	<div class="menu-panel" in:fly={{ y: -8, duration: 180 }}>
		<div class="menu-section-label">Theme</div>
		<div class="theme-row">
			{#each THEMES as th}
				<button
					class="theme-chip"
					class:active={$theme === th}
					on:click={() => pickTheme(th)}
				>
					{th}
				</button>
			{/each}
		</div>
		<div class="menu-divider"></div>
		<div class="menu-section-label">Language</div>
		<div class="lang-row">
			{#each SUPPORTED_LANGS as lang}
				<button
					class="lang-chip"
					class:active={$currentLang === lang.code}
					on:click={() => pickLang(lang.code)}
				>
					{lang.code.toUpperCase()}
				</button>
			{/each}
		</div>
	</div>
{/if}

<style>
	.offline-bar {
		background: var(--danger, #ef4444);
		color: var(--text-on-accent, #fff);
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 600;
		text-align: center;
		padding: 4px 8px;
		letter-spacing: 0.5px;
	}

	.m-topbar {
		height: 48px;
		display: flex;
		align-items: center;
		padding: 0 12px;
		gap: 8px;
		background: color-mix(in srgb, var(--bg-surface) 92%, transparent);
		backdrop-filter: blur(20px);
		border-bottom: 1px solid var(--border-accent);
		flex-shrink: 0;
		z-index: 200;
	}

	.topbar-spacer {
		flex: 1;
	}

	/* Home state */
	.logo {
		font-family: var(--font-display, 'Syne', sans-serif);
		font-size: 14px;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: 2px;
	}

	.logo-mark {
		color: var(--accent);
	}

	.menu-btn {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 50%;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}

	.menu-dots {
		font-size: 18px;
		color: var(--text-secondary);
		letter-spacing: 1px;
		line-height: 1;
	}

	/* App state */
	.back-btn {
		display: flex;
		align-items: center;
		gap: 2px;
		background: none;
		border: none;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		padding: 6px 4px;
		flex-shrink: 0;
	}

	.back-arrow {
		font-size: 24px;
		color: var(--accent);
		line-height: 1;
	}

	.back-label {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--accent);
	}

	.app-context {
		display: flex;
		align-items: center;
		gap: 7px;
		min-width: 0;
	}

	.app-emoji {
		font-size: 18px;
		line-height: 1;
		flex-shrink: 0;
	}

	.app-name {
		font-family: var(--font-display, 'Syne', sans-serif);
		font-size: 15px;
		font-weight: 700;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Dropdown menu */
	.menu-backdrop {
		position: fixed;
		inset: 0;
		z-index: 300;
	}

	.menu-panel {
		position: fixed;
		top: 52px;
		right: 10px;
		z-index: 400;
		background: var(--bg-surface);
		border: 1px solid var(--border-accent);
		border-radius: var(--radius-lg, 14px);
		padding: 14px 16px;
		min-width: 220px;
		box-shadow: 0 8px 32px rgba(0,0,0,0.4);
	}

	.menu-section-label {
		font-family: var(--font-mono);
		font-size: 9px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 2px;
		color: var(--accent);
		margin-bottom: 8px;
	}

	.menu-divider {
		height: 1px;
		background: var(--border);
		margin: 12px 0;
	}

	.theme-row,
	.lang-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.theme-chip,
	.lang-chip {
		padding: 5px 10px;
		border-radius: 20px;
		font-family: var(--font-mono);
		font-size: 11px;
		border: 1px solid var(--border);
		background: var(--bg-elevated);
		color: var(--text-secondary);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition: all 0.12s ease;
		text-transform: capitalize;
	}

	.theme-chip.active,
	.lang-chip.active {
		background: var(--accent-dim);
		border-color: var(--accent-border);
		color: var(--accent);
	}
</style>
