<script>
	import { openFeedback } from '$lib/stores/feedback.js';
	import { t } from '$lib/i18n/index.js';
</script>

<button
	class="bug-btn"
	on:click={() => openFeedback('bug')}
	title={$t('feedback.reportBug')}
	aria-label={$t('feedback.reportBug')}
>
	🐛
</button>

<style>
	.bug-btn {
		position: fixed;
		bottom: 80px;
		left: 20px;
		z-index: 9000;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		font-size: 18px;
		cursor: pointer;
		opacity: 0.5;
		transition: opacity var(--transition), transform var(--transition);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.bug-btn:hover {
		opacity: 1;
		transform: scale(1.1);
		border-color: var(--accent);
	}
</style>
