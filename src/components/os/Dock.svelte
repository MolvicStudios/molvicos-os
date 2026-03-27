<script>
	import { openWindows, focusedWindow, openApp, minimizeApp, focusApp } from '$lib/stores/os.js';
	import { getDockApps, APPS } from '$lib/apps.js';
	import { t } from '$lib/i18n/index.js';

	const dockApps = getDockApps();
	const powerApps = APPS.filter((a) => a.section === 'power');

	let bounceId = null;

	function handleDockClick(app) {
		bounceId = app.id;
		setTimeout(() => (bounceId = null), 400);

		const win = $openWindows.find((w) => w.id === app.id);
		if (win) {
			if ($focusedWindow === app.id && !win.minimized) {
				minimizeApp(app.id);
			} else {
				openApp({ ...app, title: t(`apps.${app.id}.name`) });
			}
		} else {
			openApp({ ...app, title: t(`apps.${app.id}.name`) });
		}
	}

	$: openIds = new Set($openWindows.map((w) => w.id));
</script>

<nav class="dock">
	<div class="dock-inner">
		{#each dockApps as app (app.id)}
			<button
				class="dock-icon {app.colorClass}"
				class:active={openIds.has(app.id)}
				class:focused={$focusedWindow === app.id}
				class:bounce={bounceId === app.id}
				on:click={() => handleDockClick(app)}
				title={t(`apps.${app.id}.name`)}
			>
				<span class="dock-emoji">{app.emoji}</span>
				{#if openIds.has(app.id)}
					<span class="dock-indicator"></span>
				{/if}
			</button>
		{/each}

		<span class="dock-separator"></span>

		{#each powerApps as app (app.id)}
			<button
				class="dock-icon {app.colorClass}"
				class:active={openIds.has(app.id)}
				class:focused={$focusedWindow === app.id}
				class:bounce={bounceId === app.id}
				on:click={() => handleDockClick(app)}
				title={t(`apps.${app.id}.name`)}
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
	}

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
	}
</style>
