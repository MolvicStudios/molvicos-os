<script>
	import { createEventDispatcher } from 'svelte';
	import { t } from '$lib/i18n/index.js';
	import { tutorialOpen } from '$lib/stores/os.js';

	const dispatch = createEventDispatcher();

	let step = 0;

	const steps = [
		{ key: 'welcome',    icon: '◈',  area: null },
		{ key: 'desktop',    icon: '🖥️', area: 'desktop' },
		{ key: 'dock',       icon: '⬇️', area: 'dock' },
		{ key: 'topbar',     icon: '⬆️', area: 'topbar' },
		{ key: 'cmdk',       icon: '⌨️', area: null },
		{ key: 'promptlab',  icon: '🔧', area: null },
		{ key: 'prospectly', icon: '🎯', area: null },
		{ key: 'aiworksuite',icon: '💼', area: null },
		{ key: 'repurposer', icon: '📝', area: null },
		{ key: 'briefgen',   icon: '🔍', area: null },
		{ key: 'workflow',   icon: '⚙️', area: null },
		{ key: 'terminal',   icon: '💻', area: null },
		{ key: 'localmodels',icon: '🤖', area: null },
		{ key: 'mira',       icon: '🧠', area: null },
		{ key: 'credits',    icon: '💎', area: null },
		{ key: 'settings',   icon: '⚙️', area: null },
		{ key: 'ready',      icon: '🚀', area: null }
	];

	$: current = steps[step];
	$: total = steps.length;
	$: progress = ((step + 1) / total) * 100;

	function next() {
		if (step < total - 1) step++;
		else finish();
	}
	function prev() {
		if (step > 0) step--;
	}
	function finish() {
		tutorialOpen.set(false);
		dispatch('done');
	}
</script>

<div class="tutorial-backdrop" role="dialog" aria-modal="true" aria-label="Tutorial">
	<div class="tutorial-card">
		<div class="tutorial-progress">
			<div class="tutorial-progress-bar" style="width:{progress}%"></div>
		</div>

		<button class="tutorial-skip" on:click={finish}>
			{$t('tutorial.skip')} ✕
		</button>

		<div class="tutorial-body">
			<span class="tutorial-icon">{current.icon}</span>
			<h2 class="tutorial-title">{$t(`tutorial.${current.key}.title`)}</h2>
			<p class="tutorial-desc">{$t(`tutorial.${current.key}.desc`)}</p>

			{#if current.key === 'welcome'}
				<p class="tutorial-sub">{$t('tutorial.welcome.sub')}</p>
			{/if}
		</div>

		<div class="tutorial-nav">
			<span class="tutorial-step">{step + 1} / {total}</span>
			<div class="tutorial-btns">
				{#if step > 0}
					<button class="tutorial-btn secondary" on:click={prev}>{$t('onboarding.back')}</button>
				{/if}
				<button class="tutorial-btn primary" on:click={next}>
					{step < total - 1 ? $t('onboarding.next') : $t('tutorial.launch')}
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.tutorial-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9998;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(6px);
	}

	.tutorial-card {
		position: relative;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg, 16px);
		padding: 0 36px 28px;
		max-width: 520px;
		width: 92vw;
		box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
		overflow: hidden;
	}

	.tutorial-progress {
		height: 3px;
		background: var(--bg-elevated);
	}
	.tutorial-progress-bar {
		height: 100%;
		background: var(--accent);
		transition: width 0.3s ease;
	}

	.tutorial-skip {
		position: absolute;
		top: 16px;
		right: 16px;
		background: none;
		border: none;
		color: var(--text-secondary);
		font-family: var(--font-mono);
		font-size: 12px;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: var(--radius-sm, 6px);
		transition: color 0.15s ease;
	}
	.tutorial-skip:hover {
		color: var(--text-primary);
	}

	.tutorial-body {
		text-align: center;
		padding: 36px 0 24px;
	}

	.tutorial-icon {
		font-size: 48px;
		display: block;
		margin-bottom: 16px;
	}

	.tutorial-title {
		font-family: var(--font-display);
		font-size: 22px;
		color: var(--text-primary);
		margin: 0 0 10px;
	}

	.tutorial-desc {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--text-secondary);
		line-height: 1.6;
		max-width: 400px;
		margin: 0 auto;
	}

	.tutorial-sub {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-tertiary, var(--text-secondary));
		margin-top: 12px;
		opacity: 0.7;
	}

	.tutorial-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-top: 1px solid var(--border);
		padding-top: 16px;
	}

	.tutorial-step {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-secondary);
	}

	.tutorial-btns {
		display: flex;
		gap: 8px;
	}

	.tutorial-btn {
		padding: 10px 20px;
		border-radius: var(--radius-md);
		font-family: var(--font-mono);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		border: 1px solid var(--border);
		transition: all 0.15s ease;
	}
	.tutorial-btn.secondary {
		background: var(--bg-elevated);
		color: var(--text-primary);
	}
	.tutorial-btn.secondary:hover {
		background: var(--bg-active);
	}
	.tutorial-btn.primary {
		background: var(--accent);
		color: var(--bg-base);
		border-color: var(--accent);
	}
	.tutorial-btn.primary:hover {
		opacity: 0.85;
	}
</style>
