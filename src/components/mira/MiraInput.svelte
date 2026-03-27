<script>
	import { miraStreaming, miraWebMode } from '$lib/stores/mira.js';
	import { sendMessage } from '$lib/mira/index.js';
	import { trackAction, Actions } from '$lib/feedback/tracker.js';
	import { t } from '$lib/i18n/index.js';

	let input = '';
	let textareaEl;

	$: streaming = $miraStreaming;
	$: webMode = $miraWebMode;

	async function submit() {
		const text = input.trim();
		if (!text || streaming) return;
		input = '';
		trackAction(Actions.MIRA_MSG, text.slice(0, 50));
		await sendMessage(text);
		textareaEl?.focus();
	}

	function handleKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			submit();
		}
	}

	function toggleWeb() {
		miraWebMode.update(v => !v);
	}
</script>

<div class="mira-input-area">
	<div class="input-row">
		<textarea
			bind:this={textareaEl}
			bind:value={input}
			on:keydown={handleKeydown}
			placeholder={$t('mira.inputPlaceholder')}
			rows="1"
			disabled={streaming}
		></textarea>
		<button
			class="send-btn"
			on:click={submit}
			disabled={!input.trim() || streaming}
			aria-label="Send"
		>
			↑
		</button>
	</div>
	<div class="input-toggles">
		<button
			class="toggle-btn"
			class:active={webMode}
			on:click={toggleWeb}
			title="Web research mode"
		>
			🔍 Web
		</button>
	</div>
</div>

<style>
	.mira-input-area {
		padding: 10px 12px;
		border-top: 1px solid var(--border);
		background: var(--bg-elevated);
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.input-row {
		display: flex;
		align-items: flex-end;
		gap: 6px;
	}

	textarea {
		flex: 1;
		resize: none;
		min-height: 36px;
		max-height: 120px;
		padding: 8px 10px;
		background: var(--bg-base);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-primary);
		outline: none;
		line-height: 1.5;
	}
	textarea:focus {
		border-color: var(--accent);
	}
	textarea:disabled {
		opacity: 0.5;
	}
	textarea::placeholder {
		color: var(--text-muted);
	}

	.send-btn {
		width: 36px;
		height: 36px;
		border-radius: var(--radius-sm);
		background: var(--accent);
		color: var(--bg-base);
		border: none;
		font-size: 16px;
		font-weight: 700;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: opacity var(--transition);
		flex-shrink: 0;
	}
	.send-btn:hover:not(:disabled) {
		opacity: 0.85;
	}
	.send-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.input-toggles {
		display: flex;
		gap: 6px;
	}

	.toggle-btn {
		padding: 3px 8px;
		font-family: var(--font-mono);
		font-size: 10px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		transition: all var(--transition);
	}
	.toggle-btn.active {
		border-color: var(--accent);
		color: var(--accent);
		background: var(--bg-active);
	}
	.toggle-btn:hover {
		border-color: var(--border-accent);
	}
</style>
