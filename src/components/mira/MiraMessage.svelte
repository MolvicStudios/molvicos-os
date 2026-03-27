<script>
	export let msg;

	$: isUser = msg.role === 'user';

	/**
	 * Basic markdown: **bold**, *italic*, `code`, ```blocks```, and line breaks.
	 */
	function renderMarkdown(text) {
		if (!text) return '';
		return text
			.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
			.replace(/`([^`]+)`/g, '<code>$1</code>')
			.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
			.replace(/\*([^*]+)\*/g, '<em>$1</em>')
			.replace(/\n/g, '<br>');
	}
</script>

<div class="msg" class:user={isUser} class:assistant={!isUser}>
	<div class="msg-content">
		{#if isUser}
			<p>{msg.content}</p>
		{:else}
			<div class="md">{@html renderMarkdown(msg.content)}</div>
		{/if}
	</div>
	<span class="msg-time">
		{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
	</span>
</div>

<style>
	.msg {
		max-width: 90%;
		display: flex;
		flex-direction: column;
		gap: 2px;
		animation: fadeIn 0.15s ease;
	}

	.msg.user {
		align-self: flex-end;
	}

	.msg.assistant {
		align-self: flex-start;
	}

	.msg-content {
		padding: 10px 14px;
		border-radius: var(--radius-md);
		font-family: var(--font-mono);
		font-size: 12px;
		line-height: 1.6;
		word-break: break-word;
	}

	.user .msg-content {
		background: var(--accent);
		color: var(--bg-base);
		border-bottom-right-radius: 4px;
	}

	.assistant .msg-content {
		background: var(--bg-elevated);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-bottom-left-radius: 4px;
	}

	.msg-time {
		font-family: var(--font-mono);
		font-size: 9px;
		color: var(--text-muted);
		padding: 0 4px;
	}

	.user .msg-time {
		text-align: right;
	}

	/* Markdown styles */
	.md :global(pre) {
		background: var(--bg-base);
		padding: 8px 10px;
		border-radius: var(--radius-sm);
		margin: 6px 0;
		overflow-x: auto;
	}

	.md :global(code) {
		font-family: var(--font-mono);
		font-size: 11px;
		background: var(--bg-base);
		padding: 1px 4px;
		border-radius: 3px;
	}

	.md :global(pre code) {
		background: none;
		padding: 0;
	}

	.md :global(strong) {
		color: var(--text-primary);
		font-weight: 700;
	}

	.md :global(em) {
		font-style: italic;
		color: var(--text-secondary);
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(4px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
