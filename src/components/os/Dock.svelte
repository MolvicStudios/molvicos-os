<script>
	import { openWindows, focusedWindow, openApp, minimizeApp, focusApp } from '$lib/stores/os.js';
	import { getApp } from '$lib/apps.js';
	import { dockConfig } from '$lib/stores/dock.js';
	import { t } from '$lib/i18n/index.js';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	// Fixed dock apps (always visible)
	const FIXED_IDS = ['appstore', 'settings'];
	$: fixedApps = FIXED_IDS.map(id => getApp(id)).filter(Boolean);

	// User-pinned apps (selected via AppStore ★), excluding fixed ones
	$: pinnedApps = $dockConfig.filter(id => !FIXED_IDS.includes(id)).map(id => getApp(id)).filter(Boolean);

	let bounceId = null;

	async function handleDockClick(app) {
		bounceId = app.id;
		setTimeout(() => (bounceId = null), 400);

		const win = $openWindows.find((w) => w.id === app.id);
		if (win) {
			if ($focusedWindow === app.id && !win.minimized) {
				minimizeApp(app.id);
			} else {
				await openApp({ ...app, title: $t(`apps.${app.id}.name`) });
			}
		} else {
			await openApp({ ...app, title: $t(`apps.${app.id}.name`) });
		}
	}

	$: openIds = new Set($openWindows.map((w) => w.id));
</script>

<nav class="dock" aria-label="Application dock">
	<div class="dock-inner">
		<button
			class="dock-icon dock-home"
			on:click={() => dispatch('launcher')}
			title="All Apps"
			aria-label="All Apps"
		>
			<span class="dock-emoji">◈</span>
		</button>

		<span class="dock-separator"></span>

		{#each pinnedApps as app (app.id)}
			<button
				class="dock-icon {app.colorClass}"
				class:active={openIds.has(app.id)}
				class:focused={$focusedWindow === app.id}
				class:bounce={bounceId === app.id}
				on:click={() => handleDockClick(app)}
				title={$t(`apps.${app.id}.name`)}
				aria-label={$t(`apps.${app.id}.name`)}
			>
				<span class="dock-emoji">{app.emoji}</span>
				{#if openIds.has(app.id)}
					<span class="dock-indicator"></span>
				{/if}
			</button>
		{/each}

		<span class="dock-separator"></span>

		{#each fixedApps as app (app.id)}
			<button
				class="dock-icon {app.colorClass}"
				class:active={openIds.has(app.id)}
				class:focused={$focusedWindow === app.id}
				class:bounce={bounceId === app.id}
				on:click={() => handleDockClick(app)}
				title={$t(`apps.${app.id}.name`)}
				aria-label={$t(`apps.${app.id}.name`)}
			>
				<span class="dock-emoji">{app.emoji}</span>
				{#if openIds.has(app.id)}
					<span class="dock-indicator"></span>
				{/if}
			</button>
		{/each}
	</div>
</nav>

<style>
	.dock {
		position: fixed;
		bottom: 8px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 8000;
		max-width: calc(100vw - 16px);
	}

	.dock-inner {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		background: color-mix(in srgb, var(--bg-surface) 80%, transparent);
		backdrop-filter: blur(20px);
		border: 1px solid var(--border-accent);
		border-radius: var(--radius-xl);
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}

	.dock-inner::-webkit-scrollbar { display: none; }

	.dock-icon {
		position: relative;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-md);
		border: 1px solid transparent;
		transition: all var(--transition);
		cursor: pointer;
	}

	.dock-icon:hover {
		transform: scale(1.15);
		box-shadow: 0 0 12px var(--accent-glow);
	}

	.dock-icon.bounce {
		animation: bounce-dock 0.4s ease;
	}

	.dock-emoji {
		font-size: 20px;
		line-height: 1;
	}

	.dock-indicator {
		position: absolute;
		bottom: -4px;
		left: 50%;
		transform: translateX(-50%);
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--accent);
	}

	.dock-icon.focused .dock-indicator {
		width: 6px;
		height: 6px;
		box-shadow: 0 0 6px var(--accent);
	}

	.dock-separator {
		width: 1px;
		height: 24px;
		background: var(--border-accent);
		margin: 0 4px;
		flex-shrink: 0;
	}

	.dock-home {
		background: var(--accent-dim);
		border: 1px solid var(--accent-border);
	}
	.dock-home .dock-emoji {
		color: var(--accent);
		font-family: var(--font-display);
		font-size: 18px;
	}
	.dock-home:hover {
		background: var(--accent);
	}
	.dock-home:hover .dock-emoji {
		color: #000;
	}

	@media (max-width: 640px) {
		.dock-icon {
			width: 34px;
			height: 34px;
		}
		.dock-emoji {
			font-size: 17px;
		}
		.dock-inner {
			gap: 4px;
			padding: 5px 8px;
		}
	}
</style>
