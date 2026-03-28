<script>
	import { feedbackModalOpen, feedbackSubmitting, feedbackSuccess, feedbackPrefill, closeFeedback } from '$lib/stores/feedback.js';
	import { submitFeedback } from '$lib/feedback/index.js';
	import { getActionLog } from '$lib/feedback/tracker.js';
	import { getErrorLog } from '$lib/feedback/console-trap.js';
	import { openWindows, activeApp, theme } from '$lib/stores/os.js';
	import { t } from '$lib/i18n/index.js';
	import { currentLang } from '$lib/i18n/index.js';

	const TABS = ['bug', 'feedback', 'feature'];
	const SEVERITIES = ['low', 'medium', 'high', 'critical'];

	let title = '';
	let description = '';
	let severity = 'medium';
	let activeTab = 'bug';

	$: if ($feedbackModalOpen) {
		activeTab = $feedbackPrefill.type || 'bug';
		title = $feedbackPrefill.title || '';
		description = $feedbackPrefill.description || '';
		severity = $feedbackPrefill.severity || 'medium';
	}

	$: errorCount = getErrorLog().length;
	$: actionCount = getActionLog().length;
	$: appCount = $openWindows.length;

	async function handleSubmit() {
		if (!title.trim()) return;
		try {
			await submitFeedback({
				type: activeTab,
				title: title.trim(),
				description: description.trim(),
				severity: activeTab === 'bug' ? severity : null,
			});
		} catch {
			// Error already logged by submitFeedback
		}
	}

	function handleOverlayClick(e) {
		if (e.target === e.currentTarget) closeFeedback();
	}

	function handleKeydown(e) {
		if (e.key === 'Escape') closeFeedback();
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if $feedbackModalOpen}
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="feedback-overlay" on:click={handleOverlayClick}>
		<div class="feedback-modal">
			{#if $feedbackSuccess}
				<div class="success-state">
					<span class="success-icon">✓</span>
					<p>{$t('feedback.thankYou')}</p>
				</div>
			{:else}
				<div class="modal-header">
					<h2>{$t('feedback.title')}</h2>
					<button class="close-btn" on:click={closeFeedback}>✕</button>
				</div>

				<div class="tabs">
					{#each TABS as tab}
						<button
							class="tab"
							class:active={activeTab === tab}
							on:click={() => activeTab = tab}
						>
							{$t(`feedback.tab_${tab}`)}
						</button>
					{/each}
				</div>

				<div class="modal-body">
					{#if activeTab === 'bug'}
						<div class="field">
							<span>{$t('feedback.severity')}</span>
							<div class="severity-row">
								{#each SEVERITIES as sev}
									<button
										class="sev-btn"
										class:active={severity === sev}
										on:click={() => severity = sev}
									>
										{$t(`feedback.sev_${sev}`)}
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<div class="field">
						<label for="fb-title">{$t('feedback.titleLabel')}</label>
						<input
							id="fb-title"
							type="text"
							bind:value={title}
							placeholder={$t('feedback.titlePlaceholder')}
							disabled={$feedbackSubmitting}
						/>
					</div>

					<div class="field">
						<label for="fb-desc">{$t('feedback.descLabel')}</label>
						<textarea
							id="fb-desc"
							bind:value={description}
							placeholder={$t('feedback.descPlaceholder')}
							rows="4"
							disabled={$feedbackSubmitting}
						></textarea>
					</div>

					<div class="auto-capture">
						<span class="capture-label">{$t('feedback.autoCapture')}</span>
						<div class="capture-items">
							<span>📱 {appCount} {$t('feedback.appsOpen')}</span>
							<span>📋 {actionCount} {$t('feedback.actions')}</span>
							<span>{errorCount > 0 ? '⚠️' : '✓'} {errorCount} {$t('feedback.errors')}</span>
							<span>🎨 {$theme}</span>
							<span>🌐 {$currentLang}</span>
						</div>
					</div>
				</div>

				<div class="modal-footer">
					<button class="btn-cancel" on:click={closeFeedback} disabled={$feedbackSubmitting}>
						{$t('common.cancel')}
					</button>
					<button class="btn-submit" on:click={handleSubmit} disabled={$feedbackSubmitting || !title.trim()}>
						{$feedbackSubmitting ? $t('feedback.sending') : $t('feedback.submit')}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.feedback-overlay {
		position: fixed;
		inset: 0;
		z-index: 10001;
		background: #00000070;
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		animation: fadeIn 0.15s ease;
	}

	.feedback-modal {
		width: 500px;
		max-height: 80vh;
		background: var(--bg-surface);
		border: 1px solid var(--border-accent);
		border-radius: var(--radius-lg);
		box-shadow: 0 20px 60px #00000080;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.success-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 48px 24px;
		text-align: center;
	}

	.success-icon {
		font-size: 48px;
		color: var(--accent2);
	}

	.success-state p {
		font-size: 16px;
		color: var(--text-primary);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px 12px;
		border-bottom: 1px solid var(--border);
	}

	.modal-header h2 {
		font-size: 16px;
		font-family: var(--font-mono);
		color: var(--text-primary);
		margin: 0;
	}

	.close-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 16px;
		cursor: pointer;
		padding: 4px;
	}

	.close-btn:hover {
		color: var(--text-primary);
	}

	.tabs {
		display: flex;
		padding: 0 20px;
		gap: 0;
		border-bottom: 1px solid var(--border);
	}

	.tab {
		flex: 1;
		padding: 10px 0;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-muted);
		cursor: pointer;
		transition: all var(--transition);
		text-align: center;
	}

	.tab.active {
		color: var(--accent);
		border-bottom-color: var(--accent);
	}

	.tab:hover {
		color: var(--text-primary);
	}

	.modal-body {
		padding: 16px 20px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.field label {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.field input,
	.field textarea {
		padding: 8px 10px;
		background: var(--bg-input, var(--bg-base));
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--text-primary);
		outline: none;
	}

	.field input:focus,
	.field textarea:focus {
		border-color: var(--accent);
	}

	.field textarea {
		resize: vertical;
		min-height: 60px;
	}

	.severity-row {
		display: flex;
		gap: 6px;
	}

	.sev-btn {
		flex: 1;
		padding: 6px 0;
		font-family: var(--font-mono);
		font-size: 11px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		transition: all var(--transition);
	}

	.sev-btn.active {
		border-color: var(--accent);
		color: var(--accent);
		background: var(--bg-active, var(--bg-elevated));
	}

	.auto-capture {
		padding: 10px 12px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
	}

	.capture-label {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.capture-items {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 6px;
		font-size: 11px;
		color: var(--text-secondary);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		padding: 12px 20px 16px;
		border-top: 1px solid var(--border);
	}

	.btn-cancel,
	.btn-submit {
		padding: 8px 16px;
		font-family: var(--font-mono);
		font-size: 12px;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition);
	}

	.btn-cancel {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--text-secondary);
	}

	.btn-cancel:hover {
		border-color: var(--border-accent);
		color: var(--text-primary);
	}

	.btn-submit {
		background: var(--accent);
		border: 1px solid var(--accent);
		color: var(--bg-base);
		font-weight: 600;
	}

	.btn-submit:hover:not(:disabled) {
		opacity: 0.85;
	}

	.btn-submit:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
</style>
