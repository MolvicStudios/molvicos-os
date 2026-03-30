<script>
	import { onMount } from 'svelte';
	import { getUsageStats, getUsageLog } from '$lib/plans/credits.js';
	import { planStore, openUpgradeModal } from '$lib/stores/plan.js';
	import { openApp } from '$lib/stores/os.js';
	import { getApp } from '$lib/apps.js';
	import { ITINERARIES, getProgress, markStepDone, resetProgress } from '$lib/itineraries.js';
	import { t } from '$lib/i18n/index.js';

	let stats = null;
	let history = [];
	let activeTab = 'overview';

	let expandedItinerary = null;
	let progress = {};

	onMount(() => {
		stats = getUsageStats();
		history = getUsageLog().slice(0, 30);
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

	function getAppName(actionId) {
		const map = {
			prompt_optimizer: 'Prompt Lab',
			repurposer:       'Repurposer',
			brief_gen:        'Brief Gen',
			workflow_builder: 'Workflow',
			mira_message:     'MIRA',
			prospectly:       'Prospectly',
			aiworksuite:      'AIWorkSuite',
		};
		return map[actionId] || actionId;
	}

	function getAppEmoji(actionId) {
		const map = {
			prompt_optimizer: '🔧', repurposer: '📝', brief_gen: '🔍',
			workflow_builder: '⚙️', mira_message: '◈', prospectly: '🎯',
			aiworksuite: '💼',
		};
		return map[actionId] || '▪️';
	}

	function formatTime(ts) {
		const d = new Date(ts);
		return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	$: creditsDisplay = $planStore.plan === 'pro' ? '∞' : $planStore.credits;
	$: creditsMax = $planStore.plan === 'pro' ? null : 50;
	$: creditsPct = creditsMax ? Math.round(($planStore.credits / creditsMax) * 100) : 100;
</script>

<div class="dash">
	<div class="plan-banner" class:pro={$planStore.plan === 'pro'}>
		<div class="pb-left">
			<span class="pb-icon">{$planStore.plan === 'pro' ? '⚡' : '🆓'}</span>
			<div>
				<span class="pb-name">{$planStore.plan === 'pro' ? 'Pro' : 'Free'} Plan</span>
				{#if $planStore.billingPeriod}
					<span class="pb-billing">{$planStore.billingPeriod}</span>
				{/if}
			</div>
		</div>
		{#if $planStore.plan === 'free'}
			<button class="pb-upgrade" on:click={() => openUpgradeModal()}>
				Upgrade to Pro →
			</button>
		{/if}
	</div>

	<div class="credits-section">
		<div class="cs-header">
			<span class="cs-label">{$t('dashboard.creditsThisMonth')}</span>
			<span class="cs-value">{creditsDisplay}{creditsMax ? `/${creditsMax}` : ''}</span>
		</div>
		<div class="credits-bar">
			<div class="credits-fill" style="width: {creditsPct}%; background: {creditsPct < 20 ? 'var(--danger)' : 'var(--accent)'}"></div>
		</div>
	</div>

	<div class="dash-tabs">
		{#each [['overview','Overview'],['itineraries', '🗺️ ' + $t('dashboard.itineraries')],['apps','By App'],['history','History']] as [id, label]}
			<button class="dash-tab" class:active={activeTab === id} on:click={() => activeTab = id}>
				{label}
			</button>
		{/each}
	</div>

	{#if stats}
		{#if activeTab === 'overview'}
			<div class="stat-grid">
				<div class="stat-card">
					<span class="stat-label">{$t('dashboard.today')}</span>
					<span class="stat-val">{stats.totals.day}</span>
					<span class="stat-sub">credits used</span>
				</div>
				<div class="stat-card">
					<span class="stat-label">{$t('dashboard.thisWeek')}</span>
					<span class="stat-val">{stats.totals.week}</span>
					<span class="stat-sub">credits used</span>
				</div>
				<div class="stat-card">
					<span class="stat-label">{$t('dashboard.thisMonth')}</span>
					<span class="stat-val">{stats.totals.month}</span>
					<span class="stat-sub">credits used</span>
				</div>
				<div class="stat-card">
					<span class="stat-label">{$t('dashboard.totalActions')}</span>
					<span class="stat-val">{stats.totalActions}</span>
					<span class="stat-sub">all time</span>
				</div>
			</div>

			{#if stats.favoriteApp}
				<div class="favorite-app">
					<span class="fa-label">{$t('dashboard.favoriteApp')}</span>
					<span class="fa-app">
						{getAppEmoji(stats.favoriteApp)} {getAppName(stats.favoriteApp)}
					</span>
				</div>
			{/if}

		{:else if activeTab === 'itineraries'}
			<div class="itin-header">
				<span class="itin-sub">{$t('dashboard.itinerariesSub')}</span>
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

		{:else if activeTab === 'apps'}
			<div class="by-app-list">
				{#each Object.entries(stats.byApp).sort((a,b) => b[1]-a[1]) as [action, count]}
					<div class="app-usage-row">
						<span class="aur-icon">{getAppEmoji(action)}</span>
						<span class="aur-name">{getAppName(action)}</span>
						<div class="aur-bar-wrap">
							<div class="aur-bar" style="width: {Math.round((count / stats.totalActions) * 100)}%"></div>
						</div>
						<span class="aur-count">{count}×</span>
					</div>
				{/each}
				{#if Object.keys(stats.byApp).length === 0}
					<p class="empty-state">No usage recorded yet. Start using apps to see stats here.</p>
				{/if}
			</div>

		{:else}
			<div class="history-list">
				{#each history as entry}
					<div class="history-row">
						<span class="hr-icon">{getAppEmoji(entry.action)}</span>
						<span class="hr-name">{getAppName(entry.action)}</span>
						<span class="hr-cost">-{entry.cost} cr</span>
						<span class="hr-time">{formatTime(entry.ts)}</span>
					</div>
				{/each}
				{#if history.length === 0}
					<p class="empty-state">Usage history will appear here.</p>
				{/if}
			</div>
		{/if}
	{:else}
		<p class="loading-state">Loading stats...</p>
	{/if}
</div>

<style>
	.dash { display: flex; flex-direction: column; height: 100%; overflow: auto;
		padding: 14px; font-family: var(--font-mono); gap: 12px; }

	.plan-banner {
		display: flex; align-items: center; justify-content: space-between;
		padding: 10px 14px; border-radius: var(--radius-md);
		background: var(--bg-input); border: 1px solid var(--border);
	}
	.plan-banner.pro { border-color: var(--accent-border); }
	.pb-left { display: flex; align-items: center; gap: 8px; }
	.pb-icon  { font-size: 16px; }
	.pb-name  { font-size: 12px; color: var(--text-primary); display: block; }
	.pb-billing { font-size: 10px; color: var(--text-secondary); }
	.pb-upgrade {
		background: var(--accent); border: none; border-radius: var(--radius-sm);
		color: #000; font-size: 11px; padding: 5px 12px; cursor: pointer;
		font-family: var(--font-mono);
	}

	.credits-section { display: flex; flex-direction: column; gap: 6px; }
	.cs-header { display: flex; justify-content: space-between; font-size: 11px; }
	.cs-label  { color: var(--text-secondary); }
	.cs-value  { color: var(--text-primary); font-weight: 500; }
	.credits-bar { height: 6px; background: var(--bg-input); border-radius: 3px; overflow: hidden; }
	.credits-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }

	.dash-tabs { display: flex; gap: 4px; }
	.dash-tab {
		background: none; border: 1px solid var(--border);
		border-radius: var(--radius-sm); font-size: 11px; padding: 5px 12px;
		cursor: pointer; font-family: var(--font-mono); color: var(--text-secondary);
		transition: all var(--transition);
	}
	.dash-tab.active { background: var(--accent-dim); border-color: var(--accent-border); color: var(--accent); }

	.stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
	.stat-card {
		background: var(--bg-input); border-radius: var(--radius-sm);
		padding: 10px 12px; display: flex; flex-direction: column; gap: 2px;
	}
	.stat-label { font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }
	.stat-val   { font-size: 22px; font-weight: 500; color: var(--text-primary); }
	.stat-sub   { font-size: 10px; color: var(--text-secondary); }

	.favorite-app {
		display: flex; align-items: center; justify-content: space-between;
		padding: 10px 14px; background: var(--bg-input); border-radius: var(--radius-sm);
		font-size: 12px;
	}
	.fa-label { color: var(--text-secondary); }
	.fa-app   { color: var(--text-primary); font-weight: 500; }

	.by-app-list { display: flex; flex-direction: column; gap: 8px; }
	.app-usage-row { display: flex; align-items: center; gap: 8px; font-size: 11px; }
	.aur-icon  { width: 18px; text-align: center; font-size: 13px; }
	.aur-name  { width: 90px; color: var(--text-secondary); }
	.aur-bar-wrap { flex: 1; height: 4px; background: var(--bg-input); border-radius: 2px; overflow: hidden; }
	.aur-bar   { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.5s; }
	.aur-count { width: 30px; text-align: right; color: var(--text-secondary); }

	.history-list { display: flex; flex-direction: column; gap: 4px; }
	.history-row { display: flex; align-items: center; gap: 8px; font-size: 11px;
		padding: 6px 0; border-bottom: 0.5px solid var(--border); }
	.hr-icon { width: 18px; text-align: center; }
	.hr-name { flex: 1; color: var(--text-secondary); }
	.hr-cost { color: var(--accent); width: 50px; text-align: right; }
	.hr-time { color: var(--text-muted); font-size: 10px; width: 100px; text-align: right; }

	.empty-state  { font-size: 11px; color: var(--text-secondary); text-align: center; padding: 20px 0; }
	.loading-state { font-size: 11px; color: var(--text-secondary); text-align: center; padding: 30px 0; }

	/* Itineraries */
	.itineraries-section {
		margin-top: 8px; padding-top: 12px; border-top: 1px solid var(--border);
	}
	.itin-header { display: flex; flex-direction: column; gap: 2px; margin-bottom: 12px; }
	.itin-title { font-size: 13px; color: var(--text-primary); font-weight: 500; }
	.itin-sub { font-size: 10px; color: var(--text-secondary); }

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
		color: #000;
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
	.step-done-btn:hover { background: var(--accent); color: #000; }

	.itin-complete-row {
		display: flex; align-items: center; justify-content: space-between;
		padding: 8px 0; font-size: 11px; color: var(--accent2, #00cc88);
	}

	@keyframes slideDown {
		from { opacity: 0; transform: translateY(-4px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
