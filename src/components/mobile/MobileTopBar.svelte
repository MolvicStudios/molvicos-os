<script>
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { t } from '$lib/i18n/index.js';
	import ThemeToggle from '../ui/ThemeToggle.svelte';
	import { userProfile } from '$lib/stores/user.js';

	export let activeApp = null;

	const dispatch = createEventDispatcher();

	let clock = '';
	let interval;
	let isOffline = false;

	function updateClock() {
		const now = new Date();
		clock = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function handleOnline() { isOffline = false; }
	function handleOffline() { isOffline = true; }

	onMount(() => {
		updateClock();
		interval = setInterval(updateClock, 1000);
		isOffline = !navigator.onLine;
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);
	});

	onDestroy(() => {
		clearInterval(interval);
		window.removeEventListener('online', handleOnline);
		window.removeEventListener('offline', handleOffline);
	});

	$: initials = $userProfile.name
		? $userProfile.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
		: 'MV';
</script>

{#if isOffline}
	<div class="offline-bar">📡 Offline — local models still available</div>
{/if}

<header class="m-topbar">
	<div class="m-topbar-left">
		{#if activeApp}
			<button class="back-btn" on:click={() => dispatch('back')} aria-label="Back to home">
				‹
			</button>
			<span class="app-name">{$t(`apps.${activeApp.id}.name`)}</span>
		{:else}
			<span class="logo"><span class="logo-mark">◈</span> MOLVICOS</span>
		{/if}
	</div>
	<div class="m-topbar-right">
		<ThemeToggle />
		<span class="avatar">{initials}</span>
		<span class="clock">{clock}</span>
	</div>
</header>

<style>
	.offline-bar {
		background: var(--danger, #ef4444);
		color: #fff;
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 600;
		text-align: center;
		padding: 4px 8px;
		letter-spacing: 0.5px;
	}

	.m-topbar {
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 12px;
		background: color-mix(in srgb, var(--bg-surface) 90%, transparent);
		backdrop-filter: blur(20px);
		border-bottom: 1px solid var(--border-accent);
		flex-shrink: 0;
		z-index: 100;
	}

	.m-topbar-left {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
		flex: 1;
	}

	.m-topbar-right {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

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

	.back-btn {
		font-size: 28px;
		line-height: 1;
		color: var(--accent);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0 2px;
		display: flex;
		align-items: center;
		-webkit-tap-highlight-color: transparent;
	}

	.app-name {
		font-family: var(--font-mono);
		font-size: 13px;
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.avatar {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--accent-dim);
		border: 1px solid var(--accent-border);
		color: var(--accent);
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.clock {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-secondary);
		white-space: nowrap;
	}
</style>
