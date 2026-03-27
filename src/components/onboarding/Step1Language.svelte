<script>
	import { createEventDispatcher } from 'svelte';
	import { currentLang, setLang, SUPPORTED_LANGS, t } from '$lib/i18n/index.js';

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
</script>

<div class="step">
	<h2 class="step-title">{$t('onboarding.step1.title')}</h2>
	<p class="step-desc">{$t('onboarding.step1.subtitle')}</p>

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
</div>

<style>
	.step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
	}

	.step-title {
		font-family: var(--font-display);
		font-size: 28px;
		color: var(--text-primary);
		text-align: center;
	}

	.step-desc {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--text-secondary);
		text-align: center;
		max-width: 400px;
	}

	.lang-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 12px;
		width: 100%;
		max-width: 500px;
		margin-top: 12px;
	}

	.lang-card {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 16px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition);
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

	.lang-flag {
		font-size: 22px;
	}

	.lang-label {
		flex: 1;
	}

	.check {
		color: var(--accent);
		font-weight: 700;
	}
</style>
