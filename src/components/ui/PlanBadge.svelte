<script>
	import { planStore } from '$lib/stores/plan.js';
</script>

<span class="plan-tag" class:pro={$planStore.plan === 'pro'}>
	{$planStore.plan === 'pro' ? 'PRO' : 'FREE'}
</span>

<style>
	.plan-tag {
		font-size: 8px;
		font-family: var(--font-mono);
		text-transform: uppercase;
		letter-spacing: 1px;
		padding: 2px 6px;
		border-radius: 6px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		color: var(--text-secondary);
	}

	.plan-tag.pro {
		background: var(--accent-dim);
		border-color: var(--accent-border);
		color: var(--accent);
	}
</style>
