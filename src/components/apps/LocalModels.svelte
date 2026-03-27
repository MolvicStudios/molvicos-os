<script>
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n/index.js';
	import { detectOllama, pullModel, listModels } from '$lib/ollama/client.js';
	import { ollamaStatus, ollamaModels, hardwareProfile } from '$lib/stores/models.js';
	import { MODEL_RECOMMENDATIONS } from '$lib/hardware/scanner.js';

	export let id = 'localmodels';

	let pulling = {};
	let pullProgress = {};

	onMount(async () => {
		await checkOllama();
	});

	async function checkOllama() {
		ollamaStatus.set('checking');
		const result = await detectOllama();
		ollamaStatus.set(result.online ? 'online' : 'offline');
		ollamaModels.set(result.models);
	}

	$: profile = $hardwareProfile?.profile || 'mid';
	$: recommendations = MODEL_RECOMMENDATIONS[profile] || MODEL_RECOMMENDATIONS.mid;
	$: installedNames = new Set($ollamaModels.map((m) => m.name));

	async function handlePull(modelName) {
		pulling[modelName] = true;
		pullProgress[modelName] = 0;

		await pullModel(modelName, (data) => {
			if (data.total && data.completed) {
				pullProgress[modelName] = Math.round((data.completed / data.total) * 100);
				pullProgress = pullProgress;
			}
		});

		pulling[modelName] = false;
		pulling = pulling;
		const models = await listModels();
		ollamaModels.set(models);
	}
</script>

<div class="local-models">
	<div class="lm-header">
		<h2>🤖 {t('apps.localmodels.name')}</h2>
		<div class="lm-status" class:online={$ollamaStatus === 'online'} class:offline={$ollamaStatus === 'offline'}>
			{#if $ollamaStatus === 'online'}
				<span class="status-dot green"></span> {t('onboarding.step4.ollama_online')}
			{:else if $ollamaStatus === 'checking'}
				<span class="status-dot yellow"></span> ...
			{:else}
				<span class="status-dot red"></span> {t('onboarding.step4.ollama_offline')}
			{/if}
		</div>
	</div>

	{#if $ollamaStatus === 'offline'}
		<div class="lm-offline">
			<p>{t('onboarding.step4.installStep1')}</p>
			<p>{t('onboarding.step4.installStep2')}</p>
			<p>{t('onboarding.step4.installStep3')}</p>
			<div class="lm-actions">
				<a href="https://ollama.com" target="_blank" rel="noopener" class="btn btn-primary">
					{t('onboarding.step4.install_ollama')}
				</a>
				<button class="btn btn-secondary" on:click={checkOllama}>
					{t('onboarding.step4.detect')}
				</button>
			</div>
		</div>
	{:else if $ollamaStatus === 'online'}
		{#if $ollamaModels.length > 0}
			<div class="lm-section">
				<h3>{t('onboarding.step4.installed')}</h3>
				<div class="model-list">
					{#each $ollamaModels as model (model.name)}
						<div class="model-card installed">
							<span class="model-name">{model.name}</span>
							<span class="model-size">{model.size ? (model.size / 1e9).toFixed(1) + 'GB' : ''}</span>
							<span class="model-badge">{t('onboarding.step4.installed')}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<div class="lm-section">
			<h3>{t('onboarding.step4.recommended')}</h3>
			<div class="model-list">
				{#each recommendations as rec (rec.name)}
					<div class="model-card">
						<div class="model-info">
							<span class="model-name">{rec.name}</span>
							<span class="model-meta">{rec.size} · {rec.speed} · {rec.quality}</span>
							<span class="model-desc">{rec.desc}</span>
						</div>
						{#if installedNames.has(rec.name)}
							<span class="model-badge">{t('onboarding.step4.installed')}</span>
						{:else if pulling[rec.name]}
							<div class="pull-progress">
								<div class="pull-bar" style="width: {pullProgress[rec.name] || 0}%"></div>
								<span class="pull-text">{pullProgress[rec.name] || 0}%</span>
							</div>
						{:else}
							<button class="btn btn-small" on:click={() => handlePull(rec.name)}>
								{t('onboarding.step4.download')}
							</button>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.local-models {
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		height: 100%;
		overflow-y: auto;
	}

	.lm-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.lm-header h2 {
		font-family: var(--font-display);
		font-size: 18px;
		color: var(--text-primary);
	}

	.lm-status {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		color: var(--text-secondary);
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}
	.status-dot.green { background: var(--success); }
	.status-dot.yellow { background: var(--warning); animation: pulse-accent 1s infinite; }
	.status-dot.red { background: var(--danger); }

	.lm-offline {
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-size: 12px;
		color: var(--text-secondary);
	}

	.lm-actions {
		display: flex;
		gap: 8px;
		margin-top: 12px;
	}

	.btn {
		padding: 8px 16px;
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: 12px;
		cursor: pointer;
		border: 1px solid var(--border-accent);
		transition: all var(--transition);
	}
	.btn-primary {
		background: var(--accent);
		color: var(--bg-base);
		border-color: var(--accent);
		text-decoration: none;
	}
	.btn-primary:hover { opacity: 0.9; }
	.btn-secondary {
		background: var(--bg-surface);
		color: var(--text-primary);
	}
	.btn-secondary:hover { border-color: var(--accent); }
	.btn-small {
		padding: 4px 12px;
		font-size: 11px;
		background: var(--accent-dim);
		color: var(--accent);
		border: 1px solid var(--accent-border);
	}

	.lm-section h3 {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 1px;
		color: var(--text-secondary);
		margin-bottom: 8px;
	}

	.model-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.model-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 14px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
	}

	.model-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.model-name {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--text-primary);
	}

	.model-meta {
		font-size: 10px;
		color: var(--text-secondary);
	}

	.model-desc {
		font-size: 10px;
		color: var(--text-muted);
	}

	.model-size {
		font-size: 10px;
		color: var(--text-secondary);
	}

	.model-badge {
		font-size: 9px;
		color: var(--success);
		border: 1px solid var(--success);
		padding: 2px 8px;
		border-radius: var(--radius-sm);
		letter-spacing: 1px;
		text-transform: uppercase;
	}

	.pull-progress {
		position: relative;
		width: 80px;
		height: 20px;
		background: var(--bg-input);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.pull-bar {
		height: 100%;
		background: var(--accent);
		transition: width 0.3s ease;
	}

	.pull-text {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 9px;
		color: var(--text-primary);
	}
</style>
