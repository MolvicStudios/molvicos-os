<script>
	import { t } from '$lib/i18n/index.js';
	export const id = 'appstore';
</script>

<div class="coming-soon">
	<div class="cs-icon">🌐</div>
	<h2 class="cs-title">{$t('apps.appstore.name')}</h2>
	<p class="cs-desc">{$t('apps.appstore.desc')}</p>
	<div class="cs-badge">{$t('apps.comingSoon')}</div>
	<p class="cs-hint">{$t('apps.comingSoonHint')}</p>
</div>

<style>
	.coming-soon { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; font-family: var(--font-mono); color: var(--text-secondary); text-align: center; padding: 40px; }
	.cs-icon { font-size: 48px; margin-bottom: 8px; }
	.cs-title { font-family: var(--font-display); color: var(--text-primary); font-size: 20px; }
	.cs-desc { font-size: 12px; max-width: 280px; line-height: 1.6; }
	.cs-badge { background: var(--accent-dim); border: 1px solid var(--accent-border); color: var(--accent); font-size: 10px; padding: 4px 12px; border-radius: var(--radius-sm); letter-spacing: 2px; text-transform: uppercase; }
	.cs-hint { font-size: 11px; color: var(--text-muted); }
</style>
