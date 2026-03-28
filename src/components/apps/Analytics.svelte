<script>
	import { t } from '$lib/i18n/index.js';
	import { onMount } from 'svelte';

	let workerUrl = '';
	let password = '';
	let authenticated = false;
	let loading = false;
	let error = '';
	let data = null;
	let statusData = null;

	onMount(() => {
		workerUrl = localStorage.getItem('ms_analytics_url') || '';
		password = localStorage.getItem('ms_analytics_pw') || '';
		if (workerUrl && password) fetchData();
	});

	function saveConfig() {
		if (!workerUrl.trim()) return;
		localStorage.setItem('ms_analytics_url', workerUrl.trim());
		localStorage.setItem('ms_analytics_pw', password);
		fetchData();
	}

	async function fetchData() {
		if (!workerUrl || !password) return;
		loading = true;
		error = '';
		try {
			const base = workerUrl.replace(/\/$/, '');
			const headers = { 'Authorization': 'Basic ' + btoa('admin:' + password) };

			const [dataRes, statusRes] = await Promise.all([
				fetch(base + '/data', { headers }),
				fetch(base + '/api/status', { headers }).catch(() => null)
			]);

			if (!dataRes.ok) {
				error = dataRes.status === 401 ? 'Invalid password' : `Error ${dataRes.status}`;
				authenticated = false;
				loading = false;
				return;
			}

			data = await dataRes.json();
			if (statusRes?.ok) statusData = await statusRes.json();
			authenticated = true;
		} catch (e) {
			error = 'Connection failed. Check the worker URL.';
			authenticated = false;
		}
		loading = false;
	}

	function formatNum(n) {
		if (!n && n !== 0) return '—';
		return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
	}

	function getTopSites(max = 10) {
		if (!data?.sites) return [];
		return Object.entries(data.sites)
			.map(([domain, stats]) => ({ domain, ...stats }))
			.sort((a, b) => (b.pageviews || 0) - (a.pageviews || 0))
			.slice(0, max);
	}

	function getStatusSites() {
		if (!statusData?.sites) return [];
		return statusData.sites;
	}
</script>

<div class="an-wrap">
	{#if !authenticated}
		<div class="an-config">
			<div class="an-logo">📈</div>
			<h3 class="an-title">{$t('apps.analytics.name') || 'Analytics'}</h3>
			<p class="an-desc">{$t('apps.analytics.connectDesc') || 'Connect to your MolvicStudios Analytics Worker'}</p>

			<div class="an-form">
				<label class="an-label">Worker URL</label>
				<input class="an-input" bind:value={workerUrl} placeholder="https://analytics-worker.yourdomain.pro" />

				<label class="an-label">Password</label>
				<input class="an-input" type="password" bind:value={password} placeholder="Worker password" />

				{#if error}
					<div class="an-error">{error}</div>
				{/if}

				<button class="an-connect" on:click={saveConfig} disabled={loading || !workerUrl.trim()}>
					{loading ? '⏳ Connecting...' : '🔗 Connect'}
				</button>
			</div>
		</div>
	{:else}
		<div class="an-dashboard">
			<div class="an-toolbar">
				<span class="an-connected">● Connected</span>
				<button class="an-refresh" on:click={fetchData} disabled={loading}>
					{loading ? '⏳' : '🔄'} Refresh
				</button>
			</div>

			{#if data}
				<div class="an-cards">
					<div class="an-card">
						<span class="an-card-val">{formatNum(data.totalPageviews)}</span>
						<span class="an-card-label">Total Pageviews</span>
					</div>
					<div class="an-card">
						<span class="an-card-val">{formatNum(data.totalSessions)}</span>
						<span class="an-card-label">Sessions</span>
					</div>
					<div class="an-card">
						<span class="an-card-val">{Object.keys(data.sites || {}).length}</span>
						<span class="an-card-label">Sites Tracked</span>
					</div>
					<div class="an-card">
						<span class="an-card-val">{formatNum(data.todayPageviews)}</span>
						<span class="an-card-label">Today</span>
					</div>
				</div>

				<div class="an-section">
					<h4 class="an-section-title">Top Sites</h4>
					<div class="an-table">
						{#each getTopSites() as site, i}
							<div class="an-row">
								<span class="an-rank">#{i + 1}</span>
								<span class="an-domain">{site.domain}</span>
								<span class="an-pv">{formatNum(site.pageviews)} pv</span>
								<div class="an-bar-wrap">
									<div class="an-bar" style="width: {Math.min(100, ((site.pageviews || 0) / (getTopSites()[0]?.pageviews || 1)) * 100)}%"></div>
								</div>
							</div>
						{/each}
						{#if getTopSites().length === 0}
							<div class="an-empty">No site data yet</div>
						{/if}
					</div>
				</div>

				{#if statusData}
					<div class="an-section">
						<h4 class="an-section-title">Site Status</h4>
						<div class="an-status-grid">
							{#each getStatusSites() as site}
								<div class="an-status-item" class:up={site.status === 'up'} class:down={site.status === 'down'}>
									<span class="an-status-dot">{site.status === 'up' ? '●' : '○'}</span>
									<span class="an-status-domain">{site.domain}</span>
									{#if site.latency}<span class="an-status-ms">{site.latency}ms</span>{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		</div>
	{/if}
</div>

<style>
	.an-wrap { height: 100%; font-family: var(--font-mono); overflow-y: auto; }
	.an-config { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 10px; padding: 40px; }
	.an-logo { font-size: 48px; opacity: 0.7; }
	.an-title { font-family: var(--font-display); color: var(--text-primary); font-size: 18px; margin: 0; }
	.an-desc { font-size: 11px; color: var(--text-secondary); text-align: center; max-width: 320px; }
	.an-form { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 340px; margin-top: 12px; }
	.an-label { font-size: 10px; color: var(--text-secondary); }
	.an-input {
		padding: 8px 10px; font-size: 11px; background: var(--bg-input, var(--bg-base));
		border: 1px solid var(--border); border-radius: var(--radius-sm);
		color: var(--text-primary); font-family: var(--font-mono); outline: none;
	}
	.an-input:focus { border-color: var(--accent); }
	.an-error { font-size: 10px; color: var(--danger, #ff4444); }
	.an-connect {
		margin-top: 8px; padding: 10px; font-size: 12px;
		background: var(--accent-dim); border: 1px solid var(--accent-border);
		color: var(--accent); border-radius: var(--radius-sm); cursor: pointer;
		font-family: var(--font-mono);
	}
	.an-connect:disabled { opacity: 0.4; cursor: not-allowed; }

	.an-dashboard { padding: 16px; }
	.an-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
	.an-connected { font-size: 10px; color: var(--accent); }
	.an-refresh {
		font-size: 10px; padding: 4px 10px; background: none;
		border: 1px solid var(--border); border-radius: var(--radius-sm);
		cursor: pointer; color: var(--text-secondary); font-family: var(--font-mono);
	}
	.an-refresh:hover { border-color: var(--accent); color: var(--accent); }

	.an-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
	.an-card {
		display: flex; flex-direction: column; align-items: center; gap: 4px;
		padding: 14px 10px; border-radius: var(--radius-md);
		background: var(--bg-surface); border: 1px solid var(--border);
	}
	.an-card-val { font-size: 20px; color: var(--accent); font-family: var(--font-display); }
	.an-card-label { font-size: 9px; color: var(--text-secondary); text-align: center; }

	.an-section { margin-bottom: 20px; }
	.an-section-title { font-size: 12px; color: var(--text-primary); margin: 0 0 10px 0; }

	.an-table { display: flex; flex-direction: column; gap: 4px; }
	.an-row {
		display: flex; align-items: center; gap: 8px; padding: 6px 8px;
		background: var(--bg-surface); border-radius: var(--radius-sm);
	}
	.an-rank { font-size: 9px; color: var(--text-muted); width: 24px; }
	.an-domain { font-size: 10px; color: var(--text-primary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.an-pv { font-size: 9px; color: var(--accent); min-width: 50px; text-align: right; }
	.an-bar-wrap { width: 60px; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
	.an-bar { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.3s; }
	.an-empty { font-size: 11px; color: var(--text-muted); padding: 12px; text-align: center; }

	.an-status-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 6px; }
	.an-status-item {
		display: flex; align-items: center; gap: 6px; padding: 6px 8px;
		background: var(--bg-surface); border-radius: var(--radius-sm); font-size: 10px;
	}
	.an-status-dot { color: var(--text-muted); }
	.an-status-item.up .an-status-dot { color: var(--success, #00ff88); }
	.an-status-item.down .an-status-dot { color: var(--danger, #ff4444); }
	.an-status-domain { color: var(--text-primary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.an-status-ms { color: var(--text-muted); font-size: 9px; }

	@media (max-width: 640px) {
		.an-cards { grid-template-columns: repeat(2, 1fr); }
	}
</style>
