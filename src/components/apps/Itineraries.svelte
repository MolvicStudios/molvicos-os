<script>
	import { onMount } from 'svelte';
	import { openApp } from '$lib/stores/os.js';
	import { getApp } from '$lib/apps.js';
	import { ITINERARIES, getProgress, markStepDone, resetProgress } from '$lib/itineraries.js';
	import { t } from '$lib/i18n/index.js';

	let expandedItinerary = null;
	let progress = {};

	onMount(() => {
		progress = getProgress();
	});

	function toggleItinerary(id) {
		expandedItinerary = expandedItinerary === id ? null : id;
	}

	function handleStepDone(itinId, stepIdx) {
		progress = markStepDone(itinId, stepIdx);
	}

	function handleReset(itinId) {
		progress = resetProgress(itinId);
	}

	async function handleOpenStepApp(appId) {
		const appDef = getApp(appId);
		if (appDef) {
			await openApp({ ...appDef, title: $t(`apps.${appDef.id}.name`) });
		}
	}

	function getStepsDone(itinId, totalSteps) {
		const done = progress[itinId] || [];
		return Math.min(done.length, totalSteps);
	}

	$: totalComplete = ITINERARIES.filter(i => getStepsDone(i.id, i.steps.length) === i.steps.length).length;
</script>

<div class="itin-app">
	<div class="itin-header">
		<span class="itin-sub">{$t('dashboard.itinerariesSub')}</span>
		{#if totalComplete > 0}
			<span class="itin-progress-total">{totalComplete}/{ITINERARIES.length} {$t('dashboard.completed')}</span>
		{/if}
	</div>

	<div class="itin-grid">
		{#each ITINERARIES as itin (itin.id)}
			{@const done = getStepsDone(itin.id, itin.steps.length)}
			{@const isComplete = done === itin.steps.length}
			{@const isExpanded = expandedItinerary === itin.id}
			<div class="itin-card" class:expanded={isExpanded} class:complete={isComplete}>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div class="itin-card-header" on:click={() => toggleItinerary(itin.id)}>
					<span class="itin-icon">{itin.icon}</span>
					<div class="itin-info">
						<span class="itin-name">{$t(`dashboard.itin.${itin.id}.name`)}</span>
						<span class="itin-desc">{$t(`dashboard.itin.${itin.id}.desc`)}</span>
					</div>
					<div class="itin-meta">
						<span class="itin-badge">{$t(`dashboard.${itin.difficulty}`)}</span>
						<span class="itin-time">⏱ {itin.estimatedMinutes} {$t('dashboard.min')}</span>
						{#if isComplete}
							<span class="itin-complete-badge">✓</span>
						{:else if done > 0}
							<span class="itin-progress-text">{done}/{itin.steps.length}</span>
						{/if}
					</div>
					<span class="itin-chevron" class:open={isExpanded}>›</span>
				</div>

				{#if isExpanded}
					<div class="itin-steps">
						{#each itin.steps as step, i}
							{@const stepDone = (progress[itin.id] || []).includes(i)}
							<div class="itin-step" class:done={stepDone}>
								<span class="step-num">{i + 1}</span>
								<div class="step-info">
									<span class="step-action">{$t(`dashboard.itin.${itin.id}.steps.${i}`)}</span>
									<span class="step-app">{getApp(step.appId)?.emoji} {$t(`apps.${step.appId}.name`)}</span>
								</div>
								<div class="step-actions">
									<button class="step-open" on:click|stopPropagation={() => handleOpenStepApp(step.appId)}>
										{$t('dashboard.openApp')} →
									</button>
									{#if !stepDone}
										<button class="step-done-btn" on:click|stopPropagation={() => handleStepDone(itin.id, i)}>
											✓
										</button>
									{/if}
								</div>
							</div>
						{/each}
						{#if isComplete}
							<div class="itin-complete-row">
								<span>🎉 {$t('dashboard.completed')}</span>
								<button class="step-open" on:click|stopPropagation={() => handleReset(itin.id)}>
									↺ {$t('dashboard.reset')}
								</button>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.itin-app {
		display: flex; flex-direction: column; height: 100%;
		padding: 14px; font-family: var(--font-mono); gap: 10px;
		overflow-y: auto;
	}

	.itin-header {
		display: flex; align-items: center; justify-content: space-between;
		padding-bottom: 4px; border-bottom: 1px solid var(--border);
	}
	.itin-sub { font-size: 10px; color: var(--text-secondary); }
	.itin-progress-total { font-size: 10px; color: var(--accent); font-weight: 500; }

	.itin-grid { display: flex; flex-direction: column; gap: 6px; }

	.itin-card {
		border: 1px solid var(--border); border-radius: var(--radius-md);
		background: var(--bg-input); overflow: hidden;
		transition: border-color var(--transition);
	}
	.itin-card:hover { border-color: var(--accent-border); }
	.itin-card.complete { border-color: var(--accent2, #00cc88); opacity: 0.8; }

	.itin-card-header {
		display: flex; align-items: center; gap: 10px;
		padding: 10px 12px; cursor: pointer; user-select: none;
	}
	.itin-icon { font-size: 20px; flex-shrink: 0; }
	.itin-info { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
	.itin-name { font-size: 12px; color: var(--text-primary); font-weight: 500; }
	.itin-desc { font-size: 10px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

	.itin-meta { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
	.itin-badge {
		font-size: 9px; padding: 2px 6px; border-radius: var(--radius-sm);
		background: var(--accent-dim); color: var(--accent); border: 1px solid var(--accent-border);
	}
	.itin-time { font-size: 9px; color: var(--text-muted); }
	.itin-complete-badge { font-size: 12px; color: var(--accent2, #00cc88); }
	.itin-progress-text { font-size: 10px; color: var(--accent); font-weight: 500; }

	.itin-chevron {
		font-size: 16px; color: var(--text-muted); transition: transform 0.15s ease;
		flex-shrink: 0;
	}
	.itin-chevron.open { transform: rotate(90deg); }

	.itin-steps {
		border-top: 1px solid var(--border); padding: 6px 12px 10px;
		display: flex; flex-direction: column; gap: 4px;
		animation: slideDown 0.15s ease;
	}

	.itin-step {
		display: flex; align-items: center; gap: 8px;
		padding: 6px 0; border-bottom: 0.5px solid var(--border);
	}
	.itin-step:last-child { border-bottom: none; }
	.itin-step.done { opacity: 0.5; }

	.step-num {
		width: 20px; height: 20px; border-radius: 50%;
		background: var(--accent-dim); border: 1px solid var(--accent-border);
		color: var(--accent); font-size: 10px; font-weight: 500;
		display: flex; align-items: center; justify-content: center; flex-shrink: 0;
	}
	.itin-step.done .step-num {
		background: var(--accent2, #00cc88); border-color: var(--accent2, #00cc88);
		color: var(--text-on-accent);
	}

	.step-info { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
	.step-action { font-size: 11px; color: var(--text-primary); }
	.step-app { font-size: 9px; color: var(--text-muted); }

	.step-actions { display: flex; gap: 4px; flex-shrink: 0; }
	.step-open {
		background: none; border: 1px solid var(--border);
		border-radius: var(--radius-sm); font-size: 10px; padding: 3px 8px;
		cursor: pointer; font-family: var(--font-mono); color: var(--text-secondary);
		transition: all var(--transition);
	}
	.step-open:hover { border-color: var(--accent); color: var(--accent); }

	.step-done-btn {
		background: var(--accent-dim); border: 1px solid var(--accent-border);
		border-radius: var(--radius-sm); font-size: 10px; padding: 3px 8px;
		cursor: pointer; color: var(--accent); font-family: var(--font-mono);
	}
	.step-done-btn:hover { background: var(--accent); color: var(--text-on-accent); }

	.itin-complete-row {
		display: flex; align-items: center; justify-content: space-between;
		padding: 8px 0; font-size: 11px; color: var(--accent2, #00cc88);
	}

	@keyframes slideDown {
		from { opacity: 0; transform: translateY(-4px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
