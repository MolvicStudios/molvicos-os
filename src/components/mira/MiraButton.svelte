<script>
	import { miraOpen, miraThinking, miraStreaming, miraUnread, toggleMira } from '$lib/stores/mira.js';

	$: unread = $miraUnread;
	$: isActive = $miraOpen;
	$: thinking = $miraThinking;
	$: streaming = $miraStreaming;
</script>

<button
	class="mira-button"
	class:active={isActive}
	class:thinking={thinking}
	class:streaming={streaming}
	on:click={toggleMira}
	aria-label="Toggle MIRA assistant"
>
	{#if thinking}
		<div class="mira-spinner"></div>
	{:else if streaming}
		<div class="mira-wave">
			<span></span><span></span><span></span>
		</div>
	{:else}
		<span class="mira-icon">✦</span>
	{/if}

	{#if unread > 0 && !isActive}
		<span class="mira-badge">{unread}</span>
	{/if}
</button>

<style>
	.mira-button {
		position: fixed;
		bottom: 80px;
		right: 20px;
		z-index: 9000;
		width: 52px;
		height: 52px;
		border-radius: 50%;
		background: var(--accent);
		border: 2px solid transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 20px var(--glow-accent);
		transition: all 0.25s ease;
		animation: mira-pulse 3s ease-in-out infinite;
	}

	.mira-button:hover {
		transform: scale(1.08);
		box-shadow: 0 6px 28px var(--glow-accent);
	}

	.mira-button.active {
		background: var(--bg-elevated);
		border-color: var(--accent);
		animation: none;
	}

	.mira-button.thinking {
		animation: none;
	}

	@keyframes mira-pulse {
		0%, 100% { box-shadow: 0 4px 20px var(--glow-accent); }
		50% { box-shadow: 0 4px 32px var(--glow-accent), 0 0 8px var(--accent); }
	}

	.mira-icon {
		font-size: 22px;
		color: var(--bg-base);
		font-weight: 700;
	}

	.mira-button.active .mira-icon {
		color: var(--accent);
		font-size: 18px;
	}

	/* Spinner for thinking */
	.mira-spinner {
		width: 22px;
		height: 22px;
		border: 2px solid var(--bg-base);
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* Waveform for streaming */
	.mira-wave {
		display: flex;
		gap: 3px;
		align-items: center;
		height: 20px;
	}

	.mira-wave span {
		width: 3px;
		height: 8px;
		background: var(--bg-base);
		border-radius: 2px;
		animation: wave 0.8s ease-in-out infinite;
	}
	.mira-wave span:nth-child(2) { animation-delay: 0.15s; }
	.mira-wave span:nth-child(3) { animation-delay: 0.3s; }

	@keyframes wave {
		0%, 100% { height: 8px; }
		50% { height: 18px; }
	}

	/* Unread badge */
	.mira-badge {
		position: absolute;
		top: -4px;
		right: -4px;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		background: var(--danger, #ff4444);
		color: var(--text-on-accent, #fff);
		border-radius: 9px;
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}
</style>
