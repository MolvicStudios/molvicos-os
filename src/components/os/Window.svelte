<script>
	import { onMount, onDestroy } from 'svelte';
	import { closeApp, minimizeApp, maximizeApp, focusApp, updateWindowPosition, updateWindowSize, windowOrder } from '$lib/stores/os.js';
	import { trackAction, Actions } from '$lib/feedback/tracker.js';
	import { t } from '$lib/i18n/index.js';

	export let id;
	export let title = '';
	export let icon = '📦';
	export let component;
	export let width = 700;
	export let height = 500;
	export let x = 100;
	export let y = 80;
	export let credits = 0;
	export let minimized = false;
	export let maximized = false;
	export let colorClass = '';

	// Clamp initial size/position to viewport
	onMount(() => {
		const vw = window.innerWidth;
		const vh = window.innerHeight - 36; // account for window-area offset
		width = Math.min(width, vw - 32);
		height = Math.min(height, vh - 80);
		x = Math.max(0, Math.min(x, vw - width));
		y = Math.max(0, Math.min(y, vh - 60));
	});

	let dragging = false;
	let resizing = false;
	let dragOffset = { x: 0, y: 0 };

	// Track active listeners for cleanup
	let activeDragCleanup = null;
	let activeResizeCleanup = null;

	$: zIndex = $windowOrder.indexOf(id) + 100;

	function handleTitleMouseDown(e) {
		if (maximized) return;
		if (e.target.closest('button')) return;
		if (e.button !== 0) return;
		dragging = true;
		const container = e.target.closest('.window')?.parentElement;
		const containerRect = container?.getBoundingClientRect();
		const containerTop = containerRect ? containerRect.top : 36;
		dragOffset = { x: e.clientX - x, y: (e.clientY - containerTop + (container?.scrollTop || 0)) - y };
		focusApp(id);
		e.preventDefault();

		function onMouseMove(e) {
			if (!dragging) return;
			const scrollTop = container?.scrollTop || 0;
			const mouseContainerY = e.clientY - containerTop + scrollTop;
			const rawX = e.clientX - dragOffset.x;
			const rawY = mouseContainerY - dragOffset.y;
			const clampedX = Math.max(-width + 80, Math.min(rawX, window.innerWidth - 80));
			const clampedY = Math.max(scrollTop, rawY);
			requestAnimationFrame(() => {
				x = clampedX;
				y = clampedY;
				updateWindowPosition(id, clampedX, clampedY);
			});
		}

		function onMouseUp() {
			dragging = false;
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
			activeDragCleanup = null;
		}

		// Clean up previous drag if still active
		activeDragCleanup?.();
		activeDragCleanup = () => {
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		};

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
	}

	function handleResizeMouseDown(e) {
		e.stopPropagation();
		resizing = true;
		const startX = e.clientX;
		const startY = e.clientY;
		const startW = width;
		const startH = height;

		function onMouseMove(e) {
			if (!resizing) return;
			const maxW = window.innerWidth - x;
			const maxH = window.innerHeight - y;
			const newW = Math.min(maxW, Math.max(300, startW + (e.clientX - startX)));
			const newH = Math.min(maxH, Math.max(200, startH + (e.clientY - startY)));
			requestAnimationFrame(() => {
				width = newW;
				height = newH;
				updateWindowSize(id, newW, newH);
			});
		}

		function onMouseUp() {
			resizing = false;
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
			activeResizeCleanup = null;
		}

		// Clean up previous resize if still active
		activeResizeCleanup?.();
		activeResizeCleanup = () => {
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		};

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
	}

	function handleWindowClick() {
		focusApp(id);
	}

	function requestClose() {
		trackAction(Actions.CLOSE_APP, id);
		closeApp(id);
	}

	onDestroy(() => {
		activeDragCleanup?.();
		activeResizeCleanup?.();
	});
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="window"
	class:minimized
	class:maximized
	style={maximized
		? `position: fixed; top: 36px; left: 0; width: 100vw; height: calc(100vh - 36px - 60px); z-index: ${zIndex};`
		: `left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px; z-index: ${zIndex};`}
	on:mousedown={handleWindowClick}
>
	<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
	<div class="titlebar" on:mousedown={handleTitleMouseDown} role="banner">
		<div class="titlebar-left">
			<span class="title-dot {colorClass}"></span>
			<span class="title-icon">{icon}</span>
			<span class="title-text">{title}</span>
		</div>
		<div class="titlebar-right">
			{#if credits > 0}
				<span class="credits-cost">⚡{credits}</span>
			{/if}
			<button class="win-btn minimize" on:click|stopPropagation={() => minimizeApp(id)} title={$t('os.minimize')} aria-label={$t('os.minimize')}>
				<span class="dot dot-yellow"></span>
			</button>
			<button class="win-btn maximize" on:click|stopPropagation={() => maximizeApp(id)} title={$t('os.maximize')} aria-label={$t('os.maximize')}>
				<span class="dot dot-green"></span>
			</button>
			<button class="win-btn close" on:click|stopPropagation={requestClose} title={$t('os.close')} aria-label={$t('os.close')}>
				<span class="dot dot-red"></span>
			</button>
		</div>
	</div>
	<div class="window-body">
		<svelte:component this={component} {id} />
	</div>
	{#if !maximized}
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="resize-handle" on:mousedown={handleResizeMouseDown}></div>
	{/if}
</div>

<style>
	.window {
		position: absolute;
		display: flex;
		flex-direction: column;
		background: var(--bg-surface);
		border: 1px solid var(--border-accent);
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		box-shadow: var(--win-shadow);
		overflow: hidden;
		animation: slideUp 0.2s ease;
		transition: opacity 0.15s ease;
		pointer-events: auto;
	}

	.window.minimized {
		opacity: 0;
		pointer-events: none;
		transform: scale(0.8) translateY(100px);
	}

	.window.maximized {
		border-radius: 0;
	}

	.titlebar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 32px;
		padding: 0 10px;
		background: var(--bg-elevated);
		border-bottom: 1px solid var(--border);
		cursor: grab;
		user-select: none;
		flex-shrink: 0;
	}

	.titlebar:active {
		cursor: grabbing;
	}

	.titlebar-left {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.title-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		border: 1px solid;
	}

	.title-icon {
		font-size: 14px;
		line-height: 1;
	}

	.title-text {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-primary);
	}

	.titlebar-right {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.credits-cost {
		font-size: 10px;
		color: var(--accent2);
		margin-right: 4px;
	}

	.win-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
	}

	.dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		transition: opacity var(--transition);
	}

	.dot-red {
		background: #ff5f57;
	}
	.dot-yellow {
		background: #febc2e;
	}
	.dot-green {
		background: #28c840;
	}

	.dot:hover {
		opacity: 0.8;
	}

	.window-body {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		position: relative;
		min-height: 0;
	}

	.resize-handle {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 16px;
		height: 16px;
		cursor: nwse-resize;
		z-index: 10;
	}

	.resize-handle::after {
		content: '';
		position: absolute;
		bottom: 3px;
		right: 3px;
		width: 8px;
		height: 8px;
		border-right: 2px solid var(--text-muted);
		border-bottom: 2px solid var(--text-muted);
	}
</style>
