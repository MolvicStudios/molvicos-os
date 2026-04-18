<script>
	import { onMount } from 'svelte';
	import { getUsageStats, getUsageLog } from '$lib/plans/credits.js';
	import { t } from '$lib/i18n/index.js';

	let stats = null;
	let history = [];
	let activeTab = 'overview';

	onMount(() => {
		stats = getUsageStats();
		history = getUsageLog().slice(0, 30);
	});

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

	$: creditsDisplay = '∞';

</script>

<div class="dash">
	<div class="plan-banner pro">
		<div class="pb-left">
			<span class="pb-icon">✦</span>
			<div>
				<span class="pb-name">Free — All Features Unlocked</span>
			</div>
		</div>
	</div>

	<div class="dash-tabs">
		{#each [['overview','Overview'],['apps','By App'],['history','History']] as [id, label]}
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
		color: var(--text-on-accent); font-size: 11px; padding: 5px 12px; cursor: pointer;
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
</style>
