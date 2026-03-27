<script>
	import { currentLang, setLang, t, SUPPORTED_LANGS } from '$lib/i18n/index.js';
	import { activeApp, theme, cmdPaletteOpen } from '$lib/stores/os.js';
	import { userProfile } from '$lib/stores/user.js';
	import CreditsBadge from '../ui/CreditsBadge.svelte';
	import PlanBadge from '../ui/PlanBadge.svelte';
	import ThemeToggle from '../ui/ThemeToggle.svelte';
	import { APPS } from '$lib/apps.js';
	import { onMount, onDestroy } from 'svelte';

	let clock = '';
	let interval;

	function updateClock() {
		const now = new Date();
		clock = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	}

	onMount(() => {
		updateClock();
		interval = setInterval(updateClock, 1000);
	});

	onDestroy(() => {
		clearInterval(interval);
	});

	$: activeAppDef = $activeApp ? APPS.find((a) => a.id === $activeApp) : null;
	$: activeAppName = activeAppDef ? t(`apps.${activeAppDef.id}.name`) : '';
	$: initials = $userProfile.name
		? $userProfile.name
				.split(' ')
				.map((w) => w[0])
				.join('')
				.toUpperCase()
				.slice(0, 2)
		: 'MV';
</script>

<header class="topbar">
	<div class="topbar-left">
		<span class="logo">MOLVICOS</span>
		<div class="lang-badges">
			{#each SUPPORTED_LANGS as lang}
				<button
					class="lang-badge"
					class:active={$currentLang === lang.code}
					on:click={() => setLang(lang.code)}
				>
					{lang.code.toUpperCase()}
				</button>
			{/each}
		</div>
	</div>

	<div class="topbar-center">
		{#if activeAppName}
			<span class="active-app" key={$activeApp}>{activeAppName}</span>
		{/if}
	</div>

	<div class="topbar-right">
		<CreditsBadge />
		<ThemeToggle />
		<button class="avatar-pill" title={$userProfile.name || 'User'}>
			<span class="initials">{initials}</span>
			<PlanBadge />
		</button>
		<span class="clock">{clock}</span>
	</div>
</header>

<style>
	.topbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 36px;
		z-index: 9000;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 12px;
		background: color-mix(in srgb, var(--bg-surface) 85%, transparent);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--border-accent);
		font-size: 11px;
	}

	.topbar-left,
	.topbar-right {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.topbar-center {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
	}

	.logo {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 13px;
		color: var(--accent);
		letter-spacing: 3px;
	}

	.lang-badges {
		display: flex;
		gap: 3px;
	}

	.lang-badge {
		padding: 2px 6px;
		border-radius: 10px;
		font-size: 9px;
		font-family: var(--font-mono);
		letter-spacing: 0.5px;
		color: var(--text-secondary);
		background: transparent;
		border: 1px solid var(--border);
		transition: all var(--transition);
	}

	.lang-badge:hover {
		color: var(--text-primary);
		border-color: var(--border-accent);
	}

	.lang-badge.active {
		color: var(--accent);
		border-color: var(--accent-border);
		background: var(--accent-dim);
	}

	.active-app {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-secondary);
		animation: fadeIn 0.2s ease;
	}

	.avatar-pill {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
		border-radius: 12px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
	}

	.initials {
		font-size: 10px;
		font-weight: 700;
		color: var(--text-primary);
	}

	.plan-badge {
		font-size: 8px;
		text-transform: uppercase;
		letter-spacing: 1px;
		color: var(--accent);
		background: var(--accent-dim);
		padding: 1px 5px;
		border-radius: 6px;
	}

	.clock {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--text-secondary);
		min-width: 64px;
		text-align: right;
	}
</style>
