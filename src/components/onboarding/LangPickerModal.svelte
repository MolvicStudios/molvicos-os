<script>
	import { createEventDispatcher } from 'svelte';
	import { currentLang, setLang, t } from '$lib/i18n/index.js';

	const dispatch = createEventDispatcher();

	const languages = [
		{ code: 'en', label: 'English', flag: '🇬🇧' },
		{ code: 'es', label: 'Español', flag: '🇪🇸' },
		{ code: 'de', label: 'Deutsch', flag: '🇩🇪' },
		{ code: 'fr', label: 'Français', flag: '🇫🇷' },
		{ code: 'zh', label: '中文', flag: '🇨🇳' }
	];

	function select(code) {
		setLang(code);
	}

	function confirm() {
		dispatch('done');
	}
</script>

<div class="lang-backdrop" role="dialog" aria-modal="true" aria-label={$t('onboarding.step1.title')}>
	<div class="lang-modal">
		<div class="lang-header">
			<span class="lang-logo">◈ MOLVICOS</span>
			<h2>{$t('onboarding.step1.title')}</h2>
			<p>{$t('onboarding.step1.desc')}</p>
		</div>

		<div class="lang-grid">
			{#each languages as lang}
				<button
					class="lang-card"
					class:active={$currentLang === lang.code}
					on:click={() => select(lang.code)}
				>
					<span class="lang-flag">{lang.flag}</span>
					<span class="lang-label">{lang.label}</span>
					{#if $currentLang === lang.code}
						<span class="check">✓</span>
					{/if}
				</button>
			{/each}
		</div>

		<button class="lang-confirm" on:click={confirm}>
			{$t('onboarding.next')} →
		</button>
	</div>
</div>

<style>
	.lang-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.75);
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(8px);
	}

	.lang-modal {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg, 16px);
		padding: 40px 36px 32px;
		max-width: 480px;
		width: 92vw;
		text-align: center;
		box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
	}

	.lang-header {
		margin-bottom: 24px;
	}

	.lang-logo {
		font-family: var(--font-display);
		font-size: 14px;
		color: var(--accent);
		letter-spacing: 3px;
		text-transform: uppercase;
	}

	h2 {
		font-family: var(--font-display);
		font-size: 24px;
		color: var(--text-primary);
		margin: 12px 0 6px;
	}

	p {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--text-secondary);
	}

	.lang-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
		gap: 10px;
		margin-bottom: 24px;
	}

	.lang-card {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 14px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.15s ease;
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--text-primary);
	}
	.lang-card:hover {
		border-color: var(--border-accent);
	}
	.lang-card.active {
		border-color: var(--accent);
		background: var(--bg-active);
		box-shadow: 0 0 12px var(--glow-accent);
	}
	.lang-flag { font-size: 20px; }
	.lang-label { flex: 1; text-align: left; }
	.check { color: var(--accent); font-weight: 700; }

	.lang-confirm {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 12px 32px;
		background: var(--accent);
		color: var(--bg-base);
		border: none;
		border-radius: var(--radius-md);
		font-family: var(--font-mono);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s ease;
	}
	.lang-confirm:hover {
		opacity: 0.85;
	}
</style>
