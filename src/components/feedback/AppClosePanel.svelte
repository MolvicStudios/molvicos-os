<script>
	import { openFeedback } from '$lib/stores/feedback.js';
	import { t } from '$lib/i18n/index.js';

	export let appName = '';
	export let onDismiss = () => {};

	function reportBug() {
		openFeedback('bug', { title: `[${appName}] ` });
		onDismiss();
	}

	function sendFeedback() {
		openFeedback('feedback', { title: `[${appName}] ` });
		onDismiss();
	}
</script>

<div class="close-panel">
	<span class="close-text">{t('feedback.closeHow')} <strong>{appName}</strong>?</span>
	<div class="close-actions">
		<button class="cp-btn" on:click={sendFeedback}>💬 {t('feedback.tab_feedback')}</button>
		<button class="cp-btn bug" on:click={reportBug}>🐛 {t('feedback.tab_bug')}</button>
		<button class="cp-btn skip" on:click={onDismiss}>{t('feedback.skip')}</button>
	</div>
</div>

<style>
	.close-panel {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 10px 16px;
		background: var(--bg-elevated);
		border-top: 1px solid var(--border-accent);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		z-index: 10;
		animation: slideUp 0.15s ease;
	}

	.close-text {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-secondary);
	}

	.close-actions {
		display: flex;
		gap: 6px;
	}

	.cp-btn {
		padding: 5px 10px;
		font-family: var(--font-mono);
		font-size: 11px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all var(--transition);
	}

	.cp-btn:hover {
		border-color: var(--accent);
		color: var(--text-primary);
	}

	.cp-btn.skip {
		color: var(--text-muted);
	}

	@keyframes slideUp {
		from { transform: translateY(100%); opacity: 0; }
		to { transform: translateY(0); opacity: 1; }
	}
</style>
