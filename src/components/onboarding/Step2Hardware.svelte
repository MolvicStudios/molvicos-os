<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { t } from '$lib/i18n/index.js';
	import { scanHardware } from '$lib/hardware/scanner.js';
	import { hardwareProfile } from '$lib/stores/models.js';
	import ProgressBar from '../ui/ProgressBar.svelte';

	const dispatch = createEventDispatcher();

	let scanning = false;
	let done = false;
	let progress = 0;
	let result = null;

	async function startScan() {
		scanning = true;
		progress = 10;
		const int = setInterval(() => {
			progress = Math.min(progress + 15, 85);
		}, 300);

		try {
			result = await scanHardware();
			hardwareProfile.set(result);
			progress = 100;
		} catch (e) {
			result = { cores: '?', memory: '?', gpu: 'Unknown', tier: 'low', score: 0 };
			progress = 100;
		}
		clearInterval(int);
		scanning = false;
		done = true;
	}

	onMount(() => {
		startScan();
	});
</script>

<div class="step">
	<h2 class="step-title">{$t('onboarding.step2.title')}</h2>
	<p class="step-desc">{$t('onboarding.step2.desc')}</p>

	<div class="scanner-card">
		{#if !done}
			<div class="scan-anim">
				<div class="scan-ring"></div>
				<span class="scan-label">{$t('onboarding.step2.scanning')}</span>
			</div>
			<ProgressBar value={progress} max={100} />
		{:else if result}
			<div class="hw-results">
				<div class="hw-row">
					<span class="hw-key">CPU</span>
					<span class="hw-val">{result.cores} cores</span>
				</div>
				<div class="hw-row">
					<span class="hw-key">RAM</span>
					<span class="hw-val">{result.memory} GB</span>
				</div>
				<div class="hw-row">
					<span class="hw-key">GPU</span>
					<span class="hw-val">{result.gpu || 'N/A'}</span>
				</div>
				<div class="hw-row">
					<span class="hw-key">PROFILE</span>
					<span class="hw-val hw-tier tier-{result.tier}">{result.tier.toUpperCase()}</span>
				</div>
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
		max-width: 400px;
	}

	.scanner-card {
		width: 100%;
		max-width: 420px;
		padding: 24px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		margin-top: 8px;
	}

	.scan-anim {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		margin-bottom: 16px;
	}

	.scan-ring {
		width: 48px;
		height: 48px;
		border: 3px solid var(--border);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.scan-label {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-muted);
	}

	.hw-results {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.hw-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 0;
		border-bottom: 1px solid var(--border);
	}
	.hw-row:last-child {
		border-bottom: none;
	}

	.hw-key {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.hw-val {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--text-primary);
		font-weight: 600;
	}

	.hw-tier {
		padding: 2px 10px;
		border-radius: var(--radius-sm);
		font-size: 11px;
	}
	.tier-high { background: color-mix(in srgb, var(--success) 12%, transparent); color: var(--success, #00ff88); }
	.tier-mid { background: color-mix(in srgb, var(--warning) 12%, transparent); color: var(--warning, #ffa500); }
	.tier-low { background: color-mix(in srgb, var(--danger) 12%, transparent); color: var(--danger, #ff4444); }
</style>
