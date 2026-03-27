<script>
	import { t } from '$lib/i18n/index.js';
	import { storage } from '$lib/storage/local.js';
	import { goto } from '$app/navigation';
	import { userProfile } from '$lib/stores/user.js';

	const tips = [
		{ icon: '⌘', text: 'onboarding.step5.tip1' },
		{ icon: '🤖', text: 'onboarding.step5.tip2' },
		{ icon: '🎨', text: 'onboarding.step5.tip3' },
		{ icon: '💡', text: 'onboarding.step5.tip4' }
	];

	function finish() {
		storage.setOnboardingComplete(true);
		userProfile.update(u => ({ ...u, onboardingComplete: true }));
		goto('/os');
	}
</script>

<div class="step">
	<h2 class="step-title">{$t('onboarding.step5.title')}</h2>
	<p class="step-desc">{$t('onboarding.step5.subtitle')}</p>

	<div class="tips">
		{#each tips as tip}
			<div class="tip-card">
				<span class="tip-icon">{tip.icon}</span>
				<span class="tip-text">{$t(tip.text)}</span>
			</div>
		{/each}
	</div>

	<button class="launch-btn" on:click={finish}>
		{$t('onboarding.step5.launch')}
	</button>
</div>

<style>
	.step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 24px;
	}

	.step-title {
		font-family: var(--font-display);
		font-size: 28px;
		color: var(--text-primary);
		text-align: center;
	}

	.step-desc {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--text-secondary);
		text-align: center;
		max-width: 420px;
	}

	.tips {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		width: 100%;
		max-width: 460px;
	}

	.tip-card {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 16px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		animation: fadeIn 0.3s ease;
	}

	.tip-icon {
		font-size: 20px;
	}

	.tip-text {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-secondary);
		line-height: 1.4;
	}

	.launch-btn {
		padding: 14px 48px;
		background: var(--accent);
		color: var(--bg-base);
		border: none;
		border-radius: var(--radius-md);
		font-family: var(--font-display);
		font-size: 16px;
		font-weight: 700;
		cursor: pointer;
		transition: all var(--transition);
		letter-spacing: 0.5px;
	}
	.launch-btn:hover {
		opacity: 0.9;
		box-shadow: 0 0 20px var(--glow-accent);
	}
</style>
