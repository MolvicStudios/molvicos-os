<script>
	import { onDestroy } from 'svelte';
	import { miraOpen, miraThinking, miraStreaming, clearChat, miraContext, miraModelChosen } from '$lib/stores/mira.js';
	import { openWindows, activeApp, theme } from '$lib/stores/os.js';
	import { currentLang, t } from '$lib/i18n/index.js';
	import { planStore } from '$lib/stores/plan.js';
	import { demoMode } from '$lib/stores/models.js';
	import { initProactive, syncContext } from '$lib/mira/proactive.js';
	import MiraChat from './MiraChat.svelte';
	import MiraInput from './MiraInput.svelte';
	import MiraSuggestions from './MiraSuggestions.svelte';
	import MiraModelPicker from './MiraModelPicker.svelte';

	let proactiveInterval;
	let showPicker = false;

	function startProactive() {
		if (!proactiveInterval) proactiveInterval = initProactive();
	}

	function stopProactive() {
		if (proactiveInterval) {
			clearInterval(proactiveInterval);
			proactiveInterval = null;
		}
	}

	onDestroy(stopProactive);

	// Show picker on first open only if model not chosen AND not in demo mode
	$: if ($miraOpen && !$miraModelChosen && !$demoMode) {
		showPicker = true;
	}

	// Start/stop proactive engine based on panel visibility
	$: if ($miraOpen) startProactive(); else stopProactive();

	// Sync OS context reactively
	$: {
		if ($openWindows || $activeApp || $theme || $currentLang || $planStore) {
			syncContext();
		}
	}

	$: open = $miraOpen;
	$: thinking = $miraThinking;
	$: streaming = $miraStreaming;
</script>

{#if open}
	<aside class="mira-panel" class:open>
		<header class="mira-header">
			<div class="mira-title">
				<span class="mira-logo">✦</span>
				<div>
					<h3>MIRA</h3>
					<span class="mira-subtitle">{$t('mira.subtitle')}</span>
				</div>
			</div>
			<div class="mira-actions">
				<button class="mira-model-btn" on:click={() => showPicker = true} title="Change model">
					⊞
				</button>
				<button class="mira-clear" on:click={clearChat} title={$t('mira.clearChat')}>
					⟳
				</button>
				<button class="mira-close" on:click={() => miraOpen.set(false)} title={$t('mira.close')}>
					✕
				</button>
			</div>
		</header>

		{#if showPicker}
			<MiraModelPicker on:done={() => showPicker = false} />
		{:else}
			<MiraSuggestions />
			<MiraChat />
			<MiraInput />

			{#if thinking}
				<div class="mira-thinking">
					<span class="dot"></span><span class="dot"></span><span class="dot"></span>
					<span class="think-text">{$t('mira.thinking')}</span>
				</div>
			{/if}
		{/if}
	</aside>
{/if}

<style>
	.mira-panel {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: 360px;
		max-width: 100vw;
		z-index: 8500;
		background: var(--bg-base);
		border-left: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		animation: slideInRight 0.25s ease;
		box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3);
	}

	@keyframes slideInRight {
		from { transform: translateX(100%); opacity: 0; }
		to { transform: translateX(0); opacity: 1; }
	}

	.mira-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 16px;
		border-bottom: 1px solid var(--border);
		background: var(--bg-elevated);
		flex-shrink: 0;
	}

	.mira-title {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.mira-logo {
		font-size: 20px;
		color: var(--accent);
	}

	.mira-title h3 {
		font-family: var(--font-display);
		font-size: 15px;
		color: var(--text-primary);
		margin: 0;
		line-height: 1;
	}

	.mira-subtitle {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--text-muted);
	}

	.mira-actions {
		display: flex;
		gap: 6px;
	}

	.mira-clear,
	.mira-close,
	.mira-model-btn {
		width: 28px;
		height: 28px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: transparent;
		color: var(--text-muted);
		font-size: 14px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition);
	}
	.mira-clear:hover,
	.mira-close:hover,
	.mira-model-btn:hover {
		border-color: var(--accent);
		color: var(--text-primary);
	}

	.mira-thinking {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		background: var(--bg-elevated);
		border-top: 1px solid var(--border);
	}

	.dot {
		width: 5px;
		height: 5px;
		background: var(--accent);
		border-radius: 50%;
		animation: bounce 1s infinite;
	}
	.dot:nth-child(2) { animation-delay: 0.15s; }
	.dot:nth-child(3) { animation-delay: 0.3s; }

	@keyframes bounce {
		0%, 80%, 100% { transform: translateY(0); }
		40% { transform: translateY(-6px); }
	}

	.think-text {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-muted);
	}
</style>
