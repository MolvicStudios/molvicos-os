<script>
	import { t } from '$lib/i18n/index.js';
	import { APPS } from '$lib/apps.js';
	import { openApp } from '$lib/stores/os.js';
	import { dockConfig, saveDockConfig, resetDockConfig } from '$lib/stores/dock.js';
	import {
		mobileFeaturedConfig, saveMobileFeatured,
		mobileNavConfig, saveMobileNav,
		resetMobileConfigs
	} from '$lib/stores/mobile.js';
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

	function toggleDock(appId) {
		dockConfig.update(cfg => cfg.includes(appId) ? cfg.filter(id => id !== appId) : [...cfg, appId]);
		saveDockConfig();
	}

	function toggleMobileFeatured(appId) {
		mobileFeaturedConfig.update(cfg => {
			if (cfg.includes(appId)) return cfg.filter(id => id !== appId);
			if (cfg.length >= 3) return [...cfg.slice(1), appId]; // replace oldest
			return [...cfg, appId];
		});
		saveMobileFeatured();
	}

	function toggleMobileNav(appId) {
		mobileNavConfig.update(cfg => {
			if (cfg.includes(appId)) return cfg.filter(id => id !== appId);
			if (cfg.length >= 3) return [...cfg.slice(1), appId]; // replace oldest
			return [...cfg, appId];
		});
		saveMobileNav();
	}

	function resetAll() {
		resetDockConfig();
		resetMobileConfigs();
	}

	async function launch(app) {
		await openApp({ ...app, title: $t(`apps.${app.id}.name`) });
	}
</script>

<div class="as-wrap">
	<div class="as-header">
		<div class="as-search-row">
			<input class="as-search" bind:value={search} placeholder="🔍 Search apps..." />
		</div>
		<div class="as-top-row">
			<div class="as-filters">
				{#each SECTIONS as s}
					<button class="as-filter" class:active={filter === s.id} on:click={() => filter = s.id}>{s.label}</button>
				{/each}
			</div>
			<button class="as-reset" on:click={resetAll}>↺ Reset all</button>
		</div>
		<div class="as-legend">
			<span class="legend-item"><span class="legend-icon">★</span> Desktop dock</span>
			<span class="legend-item"><span class="legend-icon legend-feat">◆</span> Mobile featured (max 3)</span>
			<span class="legend-item"><span class="legend-icon legend-nav">▲</span> Mobile nav (max 3)</span>
		</div>
	</div>

	<div class="as-grid">
		{#each filteredApps as app (app.id)}
			<div class="as-card"
				class:docked={$dockConfig.includes(app.id)}
				class:featured={$mobileFeaturedConfig.includes(app.id)}
				class:mnav={$mobileNavConfig.includes(app.id)}
			>
				<div class="as-toggles">
					<button
						class="as-toggle dock-toggle"
						class:on={$dockConfig.includes(app.id)}
						on:click|stopPropagation={() => toggleDock(app.id)}
						title={$dockConfig.includes(app.id) ? 'Remove from Desktop Dock' : 'Add to Desktop Dock'}
					>★</button>
					<button
						class="as-toggle feat-toggle"
						class:on={$mobileFeaturedConfig.includes(app.id)}
						on:click|stopPropagation={() => toggleMobileFeatured(app.id)}
						title={$mobileFeaturedConfig.includes(app.id) ? 'Remove from Mobile Featured' : 'Add to Mobile Featured'}
					>◆</button>
					<button
						class="as-toggle nav-toggle"
						class:on={$mobileNavConfig.includes(app.id)}
						on:click|stopPropagation={() => toggleMobileNav(app.id)}
						title={$mobileNavConfig.includes(app.id) ? 'Remove from Mobile Nav' : 'Add to Mobile Nav'}
					>▲</button>
				</div>
				<button class="as-body" on:click={() => launch(app)}>
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
			</div>
		{/each}
		{#if filteredApps.length === 0}
			<div class="as-empty">No apps match your search</div>
		{/if}

		<div class="as-kofi">
			<span class="as-kofi-icon">☕</span>
			<div class="as-kofi-text">
				<span class="as-kofi-title">{$t('settings.kofiTitle')}</span>
				<span class="as-kofi-sub">{$t('settings.kofiSub')}</span>
			</div>
			<a href="https://ko-fi.com/E1E41XP6I9" target="_blank" rel="noopener noreferrer" class="as-kofi-btn">
				☕ {$t('settings.kofiButton')}
			</a>
		</div>
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
	.as-top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
	.as-filters { display: flex; gap: 4px; }
	.as-filter {
		padding: 4px 10px; font-size: 10px; background: none;
		border: 1px solid var(--border); border-radius: var(--radius-sm);
		cursor: pointer; color: var(--text-secondary); font-family: var(--font-mono);
	}
	.as-filter.active { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }
	.as-reset {
		font-size: 9px; padding: 3px 8px; background: none;
		border: 1px solid var(--border); border-radius: var(--radius-sm);
		cursor: pointer; color: var(--text-muted); font-family: var(--font-mono);
	}
	.as-reset:hover { color: var(--text-secondary); border-color: var(--accent-border); }

	/* Legend */
	.as-legend {
		display: flex; gap: 12px; flex-wrap: wrap;
	}
	.legend-item {
		display: flex; align-items: center; gap: 4px;
		font-size: 9px; color: var(--text-muted);
	}
	.legend-icon { font-size: 10px; color: var(--text-muted); }
	.legend-feat { color: #7c3aed; }
	.legend-nav { color: #0ea5e9; }

	.as-grid {
		flex: 1; overflow-y: auto; padding: 12px 16px;
		display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 10px; align-content: start;
	}
	.as-card {
		position: relative; border-radius: var(--radius-md);
		background: var(--bg-surface); border: 1px solid var(--border);
		transition: border-color var(--transition);
	}
	.as-card:hover { border-color: var(--accent-border); }
	.as-card.docked { border-color: var(--accent-border); background: var(--accent-glow); }
	.as-card.featured { box-shadow: 0 0 0 1px #7c3aed44 inset; }
	.as-card.mnav { box-shadow: 0 0 0 1px #0ea5e944 inset; }
	.as-card.docked.featured { box-shadow: 0 0 0 2px #7c3aed66 inset; }

	/* Toggle button row */
	.as-toggles {
		position: absolute; top: 6px; right: 6px; z-index: 1;
		display: flex; gap: 3px;
	}
	.as-toggle {
		background: var(--bg-elevated); border: 1px solid var(--border);
		border-radius: 50%; width: 22px; height: 22px;
		font-size: 10px; cursor: pointer; color: var(--text-muted);
		display: flex; align-items: center; justify-content: center;
		transition: all var(--transition);
	}
	.as-toggle:hover { border-color: var(--accent); color: var(--accent); }
	.dock-toggle.on { color: var(--accent); border-color: var(--accent-border); }
	.feat-toggle.on { color: #7c3aed; border-color: #7c3aed88; background: #7c3aed18; }
	.nav-toggle.on { color: #0ea5e9; border-color: #0ea5e988; background: #0ea5e918; }

	.as-body {
		display: flex; flex-direction: column; align-items: center; gap: 8px;
		padding: 16px 12px; width: 100%; background: none; border: none;
		cursor: pointer; text-align: center;
	}
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

	.as-kofi {
		grid-column: 1 / -1;
		margin-top: 8px; padding: 14px 16px;
		background: color-mix(in srgb, var(--accent) 6%, var(--bg-surface));
		border: 1px solid var(--accent-border);
		border-radius: var(--radius-md);
		display: flex; align-items: center; gap: 12px;
	}
	.as-kofi-icon { font-size: 22px; flex-shrink: 0; }
	.as-kofi-text { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
	.as-kofi-title { font-size: 12px; color: var(--text-primary); }
	.as-kofi-sub { font-size: 10px; color: var(--text-secondary); }
	.as-kofi-btn {
		white-space: nowrap; padding: 7px 14px;
		background: #FF5E5B; color: #fff; border: none;
		border-radius: var(--radius-sm); font-family: var(--font-mono);
		font-size: 11px; font-weight: 600; cursor: pointer;
		text-decoration: none; transition: opacity var(--transition);
		flex-shrink: 0;
	}
	.as-kofi-btn:hover { opacity: 0.85; }
</style>
