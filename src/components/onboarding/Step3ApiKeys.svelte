<script>
	import { createEventDispatcher } from 'svelte';
	import { t } from '$lib/i18n/index.js';
	import { apiKeys, keyStatus } from '$lib/stores/models.js';
	import { PROVIDERS, validateKey } from '$lib/providers/index.js';

	const dispatch = createEventDispatcher();

	let keys = {};
	let statuses = {};
	let validating = {};

	const providers = PROVIDERS.filter(p => p.id !== 'ollama');

	async function validate(id) {
		const key = keys[id]?.trim();
		if (!key) return;
		validating[id] = true;
		statuses[id] = 'checking';
		try {
			const ok = await validateKey(id, key);
			statuses[id] = ok ? 'valid' : 'invalid';
			if (ok) {
				apiKeys.update(k => ({ ...k, [id]: key }));
				keyStatus.update(s => ({ ...s, [id]: 'valid' }));
			}
		} catch {
			statuses[id] = 'invalid';
		}
		validating[id] = false;
	}
</script>

<div class="step">
	<h2 class="step-title">{$t('onboarding.step3.title')}</h2>
	<p class="step-desc">{$t('onboarding.step3.subtitle')}</p>

	<div class="providers">
		{#each providers as provider}
			<div class="provider-row">
				<div class="provider-info">
					<span class="provider-name">{provider.name}</span>
					{#if provider.free}
						<span class="badge-free">FREE</span>
					{/if}
				</div>
				<div class="key-input-row">
					<input
						type="password"
						class="key-input"
						placeholder="{provider.keyPrefix}..."
						bind:value={keys[provider.id]}
						on:blur={() => validate(provider.id)}
					/>
					{#if statuses[provider.id] === 'valid'}
						<span class="status valid">✓</span>
					{:else if statuses[provider.id] === 'invalid'}
						<span class="status invalid">✗</span>
					{:else if validating[provider.id]}
						<span class="status checking">…</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<p class="note">{$t('onboarding.step3.note')}</p>
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

	.providers {
		width: 100%;
		max-width: 480px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.provider-row {
		padding: 14px 16px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.provider-info {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.provider-name {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--text-primary);
		font-weight: 600;
	}

	.badge-free {
		font-family: var(--font-mono);
		font-size: 9px;
		padding: 2px 6px;
		background: var(--accent);
		color: var(--bg-base);
		border-radius: var(--radius-sm);
		font-weight: 700;
		letter-spacing: 0.5px;
	}

	.key-input-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.key-input {
		flex: 1;
		padding: 8px 10px;
		background: var(--bg-base);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-primary);
		outline: none;
	}
	.key-input:focus {
		border-color: var(--accent);
	}

	.status {
		font-size: 16px;
		font-weight: 700;
		width: 20px;
		text-align: center;
	}
	.status.valid { color: #00ff88; }
	.status.invalid { color: #ff4444; }
	.status.checking { color: var(--text-muted); }

	.note {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-muted);
		text-align: center;
		max-width: 420px;
	}
</style>
