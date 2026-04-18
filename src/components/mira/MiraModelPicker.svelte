<script>
	import { createEventDispatcher } from 'svelte';
	import { apiKeys, ollamaModels, ollamaStatus } from '$lib/stores/models.js';
	import { miraProvider, miraModel, miraModelChosen } from '$lib/stores/mira.js';
	import { MIRA_MODELS } from '$lib/mira/index.js';

	const dispatch = createEventDispatcher();

	// Provider → available model options
	const PROVIDER_MODELS = {
		groq: [
			{ id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile ⚡' },
			{ id: 'llama-3.1-8b-instant',    label: 'Llama 3.1 8B Instant (fast)' },
			{ id: 'mixtral-8x7b-32768',      label: 'Mixtral 8×7B 32K' }
		],
		openai: [
			{ id: 'gpt-4o',      label: 'GPT-4o' },
			{ id: 'gpt-4o-mini', label: 'GPT-4o Mini (fast)' },
			{ id: 'o4-mini',     label: 'o4-mini (reasoning)' }
		],
		anthropic: [
			{ id: 'claude-sonnet-4-5-20251001', label: 'Claude Sonnet 4.5' },
			{ id: 'claude-haiku-4-5-20251001',  label: 'Claude Haiku 4.5 (fast)' }
		],
		gemini: [
			{ id: 'gemini-2.0-flash',  label: 'Gemini 2.0 Flash' },
			{ id: 'gemini-1.5-flash',  label: 'Gemini 1.5 Flash' },
			{ id: 'gemini-1.5-pro',    label: 'Gemini 1.5 Pro' }
		],
		mistral: [
			{ id: 'mistral-large-latest', label: 'Mistral Large' },
			{ id: 'mistral-small-latest', label: 'Mistral Small (fast)' }
		],
		github: [
			{ id: 'gpt-4o',      label: 'GPT-4o (via GitHub)' },
			{ id: 'gpt-4o-mini', label: 'GPT-4o Mini (via GitHub)' }
		]
	};

	const PROVIDER_LABELS = {
		groq: '⚡ Groq',
		openai: '🌐 OpenAI',
		anthropic: '🔷 Anthropic',
		gemini: '✦ Gemini',
		mistral: '🌀 Mistral',
		github: '🐙 GitHub AI'
	};

	$: keys = $apiKeys;
	$: ollamaOnline = $ollamaStatus === 'online';
	$: localModels = $ollamaModels;

	// Build list of available providers (with API keys)
	$: availableProviders = Object.keys(PROVIDER_MODELS).filter(p => keys[p]?.trim());

	let selectedProvider = '';
	let selectedModel = '';

	// Auto-select first available provider
	$: if (!selectedProvider && availableProviders.length > 0) {
		selectedProvider = availableProviders[0];
		selectedModel = PROVIDER_MODELS[selectedProvider]?.[0]?.id || '';
	}
	$: if (!selectedProvider && ollamaOnline && localModels.length > 0) {
		selectedProvider = 'ollama';
		selectedModel = localModels[0]?.name || '';
	}

	function selectProvider(p) {
		selectedProvider = p;
		if (p === 'ollama') {
			selectedModel = localModels[0]?.name || '';
		} else {
			selectedModel = PROVIDER_MODELS[p]?.[0]?.id || '';
		}
	}

	function confirm() {
		if (!selectedProvider || !selectedModel) return;
		miraProvider.set(selectedProvider);
		miraModel.set(selectedModel);
		miraModelChosen.set(true);
		dispatch('done');
	}

	function skip() {
		// Use auto-detection, mark as chosen to not show again this session
		miraModelChosen.set(true);
		dispatch('done');
	}
</script>

<div class="picker-overlay">
	<div class="picker-panel">
		<div class="picker-header">
			<span class="picker-logo">✦</span>
			<div>
				<h2>Choose your AI model</h2>
				<p>Select the language model MIRA will use</p>
			</div>
		</div>

		{#if availableProviders.length === 0 && !ollamaOnline}
			<div class="no-providers">
				<p>No API keys configured and Ollama is offline.</p>
				<p>Add a key in <strong>⚙ Settings</strong> to use MIRA.</p>
				<button class="btn-skip" on:click={skip}>Continue anyway</button>
			</div>
		{:else}
			<!-- Provider tabs -->
			<div class="provider-tabs">
				{#each availableProviders as p}
					<button
						class="ptab"
						class:active={selectedProvider === p}
						on:click={() => selectProvider(p)}
					>
						{PROVIDER_LABELS[p] || p}
					</button>
				{/each}
				{#if ollamaOnline}
					<button
						class="ptab"
						class:active={selectedProvider === 'ollama'}
						on:click={() => selectProvider('ollama')}
					>
						🤖 Local (Ollama)
					</button>
				{/if}
			</div>

			<!-- Model list -->
			<div class="model-list">
				{#if selectedProvider === 'ollama'}
					{#each localModels as m}
						<label class="model-item" class:selected={selectedModel === m.name}>
							<input type="radio" bind:group={selectedModel} value={m.name} />
							<span class="model-name">{m.name}</span>
							<span class="model-tag local">local</span>
						</label>
					{/each}
				{:else if selectedProvider}
					{#each (PROVIDER_MODELS[selectedProvider] || []) as m}
						<label class="model-item" class:selected={selectedModel === m.id}>
							<input type="radio" bind:group={selectedModel} value={m.id} />
							<span class="model-name">{m.label}</span>
						</label>
					{/each}
				{/if}
			</div>

			<div class="picker-footer">
				<button class="btn-skip" on:click={skip}>Skip (auto)</button>
				<button
					class="btn-confirm"
					disabled={!selectedProvider || !selectedModel}
					on:click={confirm}
				>
					Use this model ↑
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.picker-overlay {
		position: absolute;
		inset: 0;
		z-index: 100;
		background: var(--bg-base);
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.picker-panel {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 20px 16px;
		flex: 1;
	}

	.picker-header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding-bottom: 12px;
		border-bottom: 1px solid var(--border);
	}

	.picker-logo {
		font-size: 28px;
		color: var(--accent);
	}

	.picker-header h2 {
		font-family: var(--font-display);
		font-size: 15px;
		color: var(--text-primary);
		margin: 0 0 2px;
	}

	.picker-header p {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-muted);
		margin: 0;
	}

	.no-providers {
		text-align: center;
		color: var(--text-secondary);
		font-family: var(--font-mono);
		font-size: 12px;
		padding: 20px 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
		align-items: center;
	}

	.provider-tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.ptab {
		padding: 5px 10px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: transparent;
		color: var(--text-secondary);
		font-family: var(--font-mono);
		font-size: 11px;
		cursor: pointer;
		transition: all var(--transition);
	}

	.ptab:hover {
		border-color: var(--accent);
		color: var(--text-primary);
	}

	.ptab.active {
		background: var(--accent);
		color: var(--bg-base);
		border-color: var(--accent);
	}

	.model-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
	}

	.model-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 9px 12px;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		cursor: pointer;
		transition: all var(--transition);
	}

	.model-item:hover {
		border-color: var(--accent);
		background: var(--bg-elevated);
	}

	.model-item.selected {
		border-color: var(--accent);
		background: var(--bg-active);
	}

	.model-item input {
		accent-color: var(--accent);
		cursor: pointer;
	}

	.model-name {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-primary);
		flex: 1;
	}

	.model-tag {
		font-size: 9px;
		padding: 2px 5px;
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
	}

	.model-tag.local {
		background: var(--bg-active);
		color: var(--accent);
		border: 1px solid var(--border);
	}

	.picker-footer {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
		padding-top: 12px;
		border-top: 1px solid var(--border);
	}

	.btn-skip {
		padding: 8px 14px;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		background: transparent;
		color: var(--text-secondary);
		font-family: var(--font-mono);
		font-size: 12px;
		cursor: pointer;
		transition: all var(--transition);
	}

	.btn-skip:hover {
		color: var(--text-primary);
		border-color: var(--text-secondary);
	}

	.btn-confirm {
		padding: 8px 16px;
		border-radius: var(--radius-md);
		border: none;
		background: var(--accent);
		color: var(--bg-base);
		font-family: var(--font-mono);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: opacity var(--transition);
	}

	.btn-confirm:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.btn-confirm:not(:disabled):hover {
		opacity: 0.85;
	}
</style>
