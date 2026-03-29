<script>
	import { openWindows } from '$lib/stores/os.js';
	import Window from './Window.svelte';

	let crashedWindows = {};

	function handleWindowError(winId, error) {
		console.error(`[WindowManager] App "${winId}" crashed:`, error);
		crashedWindows = { ...crashedWindows, [winId]: error?.message || 'Unknown error' };
	}

	function reloadWindow(winId) {
		crashedWindows = { ...crashedWindows };
		delete crashedWindows[winId];
		crashedWindows = crashedWindows;
	}
</script>

{#each $openWindows as win (win.id)}
	{#if crashedWindows[win.id]}
		<Window
			id={win.id}
			title={win.title}
			icon={win.icon}
			width={win.width}
			height={win.height}
			x={win.x}
			y={win.y}
			credits={win.credits}
			minimized={win.minimized}
			maximized={win.maximized}
			colorClass={win.colorClass}
		>
			<div class="crash-screen">
				<span class="crash-icon">💥</span>
				<p class="crash-title">App crashed</p>
				<p class="crash-detail">{crashedWindows[win.id]}</p>
				<button class="crash-btn" on:click={() => reloadWindow(win.id)}>↻ Reload</button>
			</div>
		</Window>
	{:else}
		<Window
			id={win.id}
			title={win.title}
			icon={win.icon}
			component={win.component}
			width={win.width}
			height={win.height}
			x={win.x}
			y={win.y}
			credits={win.credits}
			minimized={win.minimized}
			maximized={win.maximized}
			colorClass={win.colorClass}
			on:error={(e) => handleWindowError(win.id, e.detail)}
		/>
	{/if}
{/each}

<style>
	.crash-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 8px;
		padding: 24px;
		text-align: center;
		font-family: var(--font-mono);
	}
	.crash-icon { font-size: 32px; }
	.crash-title { font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0; }
	.crash-detail { font-size: 11px; color: var(--text-secondary); margin: 0; max-width: 300px; word-break: break-word; }
	.crash-btn {
		margin-top: 8px;
		padding: 6px 16px;
		border-radius: var(--radius-sm);
		background: var(--accent);
		color: var(--bg-base);
		border: none;
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 700;
		cursor: pointer;
	}
</style>
