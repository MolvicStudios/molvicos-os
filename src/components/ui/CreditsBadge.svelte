<script>
	import { planStore } from '$lib/stores/plan.js';
	import { t } from '$lib/i18n/index.js';

	$: isPro = $planStore.plan === 'pro';
</script>

<div class="credits-badge" title="{isPro ? '∞' : $planStore.credits}/{$planStore.creditsMax} {$t('os.credits')}">
	<span class="credits-icon">⚡</span>
	<span class="credits-value">{isPro ? '∞' : $planStore.credits}</span>
	<span class="credits-label">cr</span>
</div>

<style>
	.credits-badge {
		display: flex;
		align-items: center;
		gap: 3px;
		padding: 2px 8px;
		border-radius: 10px;
		background: var(--accent-dim);
		border: 1px solid var(--accent-border);
		font-size: 10px;
		font-family: var(--font-mono);
	}

	.credits-icon {
		font-size: 11px;
	}

	.credits-value {
		color: var(--accent);
		font-weight: 700;
	}

	.credits-label {
		color: var(--text-secondary);
	}
</style>
