<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { t } from '$lib/i18n/index.js';
	import { detectOllama, listModels, pullModel } from '$lib/ollama/client.js';
	import { ollamaStatus, ollamaModels } from '$lib/stores/models.js';
	import ProgressBar from '../ui/ProgressBar.svelte';

	const dispatch = createEventDispatcher();

	let checking = true;
	let available = false;
	let models = [];
	let pulling = null;
	let pullProgress = 0;

	onMount(async () => {
		try {
			available = await detectOllama();
			ollamaStatus.set(available ? 'connected' : 'not-found');
			if (available) {
				models = await listModels();
				ollamaModels.set(models);
			}
		} catch {
			available = false;
			ollamaStatus.set('not-found');
		}
		checking = false;
	});

	async function pull(name) {
		pulling = name;
		pullProgress = 0;
		try {
			await pullModel(name, (p) => { pullProgress = p; });
			models = await listModels();
			ollamaModels.set(models);
		} catch (e) {
			console.error('Pull failed:', e);
		}
		pulling = null;
	}

	const suggested = ['llama3.2:1b', 'phi3:mini', 'gemma2:2b'];
</script>

<div class="step">
	<h2 class="step-title">{$t('onboarding.step4.title')}</h2>
	<p class="step-desc">{$t('onboarding.step4.desc')}</p>

	<div class="ollama-card">
		{#if checking}
			<div class="detect">
				<div class="spinner"></div>
				<span>{$t('onboarding.step2.scanning')}</span>
			</div>
		{:else if !available}
			<div class="not-found">
				<span class="nf-icon">⚠</span>
				<p class="nf-text">{$t('onboarding.step4.ollama_offline')}</p>
				<a href="https://ollama.ai" target="_blank" rel="noopener" class="nf-link">
					{$t('onboarding.step4.install_ollama')}
				</a>
			</div>
		{:else}
			<div class="connected">
				<span class="c-badge">● {$t('onboarding.step4.ollama_online')}</span>
			</div>

			{#if models.length > 0}
				<div class="section-label">{$t('onboarding.step4.installed')}</div>
				<div class="model-list">
					{#each models as m}
						<div class="model-item">{m.name}</div>
					{/each}
				</div>
			{/if}

			<div class="section-label">{$t('onboarding.step4.recommended')}</div>
			<div class="model-list">
				{#each suggested as name}
					<div class="model-item model-pull">
						<span>{name}</span>
						{#if pulling === name}
							<ProgressBar value={pullProgress} max={100} />
						{:else}
							<button class="pull-btn" on:click={() => pull(name)}>Pull</button>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
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
		max-width: 420px;
	}

	.ollama-card {
		width: 100%;
		max-width: 460px;
		padding: 20px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.detect {
		display: flex;
		align-items: center;
		gap: 12px;
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-muted);
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid var(--border);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin { to { transform: rotate(360deg); } }

	.not-found {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.nf-icon { font-size: 28px; }

	.nf-text {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-secondary);
	}

	.nf-link {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--accent);
	}

	.connected {
		display: flex;
		align-items: center;
	}

	.c-badge {
		font-family: var(--font-mono);
		font-size: 12px;
		color: #00ff88;
	}

	.section-label {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.model-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.model-item {
		padding: 8px 12px;
		background: var(--bg-base);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-primary);
	}

	.model-pull {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.pull-btn {
		padding: 4px 12px;
		font-family: var(--font-mono);
		font-size: 11px;
		background: var(--accent);
		color: var(--bg-base);
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-weight: 700;
	}
</style>
