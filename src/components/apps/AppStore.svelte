<script>
	import { t } from '$lib/i18n/index.js';
	import { APPS } from '$lib/apps.js';
	import { openApp } from '$lib/stores/os.js';
	export const id = 'appstore';

	let search = '';
	let filter = 'all';

	const SECTIONS = [
		{ id: 'all', label: 'All' },
		{ id: 'core', label: 'Core' },
		{ id: 'power', label: 'Power' },
		{ id: 'tools', label: 'Tools' }
	];

	$: filteredApps = APPS.filter(a => {
		if (a.id === 'appstore') return false;
		const name = ($t(`apps.${a.id}.name`) || a.id).toLowerCase();
		const desc = ($t(`apps.${a.id}.desc`) || '').toLowerCase();
		const q = search.toLowerCase();
		const matchSearch = !q || name.includes(q) || desc.includes(q);
		const matchFilter = filter === 'all' || a.section === filter;
		return matchSearch && matchFilter;
	});

	async function launch(app) {
		await openApp({ ...app, title: $t(`apps.${app.id}.name`) });
	}
</script>

<div class="as-wrap">
	<div class="as-header">
		<div class="as-search-row">
			<input class="as-search" bind:value={search} placeholder="🔍 Search apps..." />
		</div>
		<div class="as-filters">
			{#each SECTIONS as s}
				<button class="as-filter" class:active={filter === s.id} on:click={() => filter = s.id}>{s.label}</button>
			{/each}
		</div>
	</div>

	<div class="as-grid">
		{#each filteredApps as app (app.id)}
			<button class="as-card" on:click={() => launch(app)}>
				<div class="as-icon {app.colorClass}">{app.emoji}</div>
				<div class="as-info">
					<span class="as-name">{$t(`apps.${app.id}.name`)}</span>
					<span class="as-desc">{$t(`apps.${app.id}.desc`)}</span>
				</div>
				<div class="as-meta">
					{#if app.credits > 0}
						<span class="as-credits">{app.credits} cr</span>
					{:else}
						<span class="as-free">Free</span>
					{/if}
					<span class="as-section">{app.section}</span>
				</div>
			</button>
		{/each}
		{#if filteredApps.length === 0}
			<div class="as-empty">No apps match your search</div>
		{/if}
	</div>
</div>

<style>
	.as-wrap { height: 100%; font-family: var(--font-mono); display: flex; flex-direction: column; overflow: hidden; }
	.as-header { padding: 12px 16px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
	.as-search-row { margin-bottom: 8px; }
	.as-search {
		width: 100%; padding: 8px 12px; font-size: 12px;
		background: var(--bg-input, var(--bg-base)); border: 1px solid var(--border);
		border-radius: var(--radius-sm); color: var(--text-primary);
		font-family: var(--font-mono); outline: none;
	}
	.as-search:focus { border-color: var(--accent); }
	.as-filters { display: flex; gap: 4px; }
	.as-filter {
		padding: 4px 10px; font-size: 10px; background: none;
		border: 1px solid var(--border); border-radius: var(--radius-sm);
		cursor: pointer; color: var(--text-secondary); font-family: var(--font-mono);
	}
	.as-filter.active { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }

	.as-grid {
		flex: 1; overflow-y: auto; padding: 12px 16px;
		display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 10px; align-content: start;
	}
	.as-card {
		display: flex; flex-direction: column; align-items: center; gap: 8px;
		padding: 16px 12px; border-radius: var(--radius-md);
		background: var(--bg-surface); border: 1px solid var(--border);
		cursor: pointer; transition: border-color var(--transition);
		text-align: center;
	}
	.as-card:hover { border-color: var(--accent-border); }
	.as-icon {
		width: 44px; height: 44px; border-radius: var(--radius-md);
		display: flex; align-items: center; justify-content: center;
		font-size: 22px; border: 1px solid;
	}
	.as-info { display: flex; flex-direction: column; gap: 2px; }
	.as-name { font-size: 12px; color: var(--text-primary); }
	.as-desc { font-size: 9px; color: var(--text-secondary); }
	.as-meta { display: flex; gap: 6px; align-items: center; }
	.as-credits { font-size: 9px; color: var(--accent2, var(--accent)); padding: 1px 6px; border: 1px solid var(--border); border-radius: 3px; }
	.as-free { font-size: 9px; color: var(--accent); padding: 1px 6px; border: 1px solid var(--accent-border); border-radius: 3px; }
	.as-section { font-size: 8px; color: var(--text-muted); text-transform: uppercase; }
	.as-empty { grid-column: 1 / -1; text-align: center; padding: 40px; font-size: 12px; color: var(--text-muted); }
</style>
