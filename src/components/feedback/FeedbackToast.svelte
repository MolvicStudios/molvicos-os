<script>
	import { feedbackSuccess } from '$lib/stores/feedback.js';
	import { t } from '$lib/i18n/index.js';
</script>

{#if $feedbackSuccess}
	<div class="feedback-toast">
		<span class="toast-icon">✓</span>
		<span>{t('feedback.thankYou')}</span>
	</div>
{/if}

<style>
	.feedback-toast {
		position: fixed;
		bottom: 70px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 9500;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		background: var(--bg-elevated);
		border: 1px solid var(--accent2);
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--text-primary);
		box-shadow: 0 8px 24px #00000040;
		animation: toastIn 0.2s ease;
	}

	.toast-icon {
		color: var(--accent2);
		font-size: 16px;
		font-weight: 700;
	}

	@keyframes toastIn {
		from { opacity: 0; transform: translateX(-50%) translateY(10px); }
		to { opacity: 1; transform: translateX(-50%) translateY(0); }
	}
</style>
