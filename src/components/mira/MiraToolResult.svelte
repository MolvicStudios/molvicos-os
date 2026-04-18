<script>
	export let msg;

	$: success = msg.toolResult?.success;
	$: callName = msg.toolCall?.name || 'unknown';
</script>

<div class="tool-result" class:success class:error={!success}>
	<div class="tool-header">
		<span class="tool-icon">{success ? '✓' : '✗'}</span>
		<span class="tool-name">{callName}</span>
	</div>
	<p class="tool-data">{msg.content}</p>
</div>

<style>
	.tool-result {
		align-self: flex-start;
		max-width: 85%;
		padding: 8px 12px;
		border-radius: var(--radius-sm);
		border-left: 3px solid;
		font-family: var(--font-mono);
		font-size: 11px;
		animation: fadeIn 0.15s ease;
		background: var(--bg-elevated);
	}

	.tool-result.success {
		border-left-color: var(--success, #00ff88);
	}
	.tool-result.error {
		border-left-color: var(--danger, #ff4444);
	}

	.tool-header {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 4px;
	}

	.tool-icon {
		font-size: 12px;
		font-weight: 700;
	}
	.success .tool-icon { color: var(--success, #00ff88); }
	.error .tool-icon { color: var(--danger, #ff4444); }

	.tool-name {
		font-size: 10px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.tool-data {
		color: var(--text-secondary);
		line-height: 1.4;
		margin: 0;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(4px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
