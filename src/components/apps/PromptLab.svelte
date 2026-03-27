<script>
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n/index.js';
	import { streamAI } from '$lib/ai/stream.js';
	import { getActiveProvider } from '$lib/providers/active.js';
	import { userProfile } from '$lib/stores/user.js';
	import { createAppHistory } from '$lib/stores/history.js';
	import { storage } from '$lib/storage/local.js';
	import { notify } from '$lib/stores/os.js';
	import { copyToClipboard, exportTXT, generateShareLink } from '$lib/utils/export.js';
	import AppShell from './shared/AppShell.svelte';
	import HistorySidebar from './shared/HistorySidebar.svelte';

	export let id = 'promptlab';

	let tab = 'optimizer';
	let showHistory = false;
	const history = createAppHistory('promptlab');

	// --- Optimizer state ---
	let input = '';
	let target = 'Universal';
	let loading = false;
	let variantA = '';
	let variantB = '';
	let variantC = '';
	let hasResult = false;

	const TARGETS = ['ChatGPT', 'Claude', 'Gemini', 'Mistral', 'Universal'];
	const VARIANT_PROMPTS = {
		A: (tgt) => `You are a prompt engineering expert. Rewrite the user's prompt for ${tgt} with a structured format: clear role, context, task, and output format. Return ONLY the improved prompt, no explanation.`,
		B: (tgt) => `You are a prompt engineering expert. Rewrite the user's prompt for ${tgt} making it concise and direct — remove all fluff, maximize signal-to-noise. Return ONLY the improved prompt.`,
		C: (tgt) => `You are a prompt engineering expert. Rewrite the user's prompt for ${tgt} using chain-of-thought technique: ask the model to think step by step and show reasoning. Return ONLY the improved prompt.`
	};

	async function optimize() {
		if (!input.trim() || loading) return;
		if (!getActiveProvider()) { notify($t('mira.noApiKey'), 'error'); return; }
		loading = true;
		variantA = ''; variantB = ''; variantC = '';
		hasResult = false;

		await Promise.all([
			streamAI({ system: VARIANT_PROMPTS.A(target), messages: [{ role: 'user', content: input }], action: 'prompt_optimizer', onChunk: (_, f) => { variantA = f; }, onDone: (f) => { variantA = f; }, onError: (e) => { variantA = `Error: ${e}`; } }),
			streamAI({ system: VARIANT_PROMPTS.B(target), messages: [{ role: 'user', content: input }], action: 'prompt_optimizer', onChunk: (_, f) => { variantB = f; }, onDone: (f) => { variantB = f; }, onError: (e) => { variantB = `Error: ${e}`; } }),
			streamAI({ system: VARIANT_PROMPTS.C(target), messages: [{ role: 'user', content: input }], action: 'prompt_optimizer', onChunk: (_, f) => { variantC = f; }, onDone: (f) => { variantC = f; }, onError: (e) => { variantC = `Error: ${e}`; } })
		]);

		hasResult = true;
		loading = false;
		history.add({ input, target, variants: [variantA, variantB, variantC] });
	}

	function saveToLibrary(content, varLabel) {
		const lib = storage.get('ms_prompt_library') || [];
		lib.unshift({
			id: crypto.randomUUID(), title: content.slice(0, 40), content,
			tags: [varLabel, target.toLowerCase()], target,
			createdAt: Date.now(), usedAt: 0, useCount: 0
		});
		storage.set('ms_prompt_library', lib);
		prompts = storage.get('ms_prompt_library') || [];
		notify($t('apps.promptlab.saveToLibrary') + ' ✓', 'success');
	}

	// --- Library state ---
	let prompts = [];
	let search = '';
	let editingId = null;
	let newTitle = '';
	let newContent = '';
	let newTags = '';
	let showAdd = false;

	onMount(() => {
		prompts = storage.get('ms_prompt_library') || [];
		const handler = (e) => {
			const { prompt, title } = e.detail || {};
			if (prompt) {
				const lib = storage.get('ms_prompt_library') || [];
				lib.unshift({
					id: crypto.randomUUID(), title: title || prompt.slice(0, 40), content: prompt,
					tags: ['mira'], target: 'Universal',
					createdAt: Date.now(), usedAt: 0, useCount: 0
				});
				storage.set('ms_prompt_library', lib);
				prompts = lib;
				notify('Prompt saved from MIRA ✓', 'success');
			}
		};
		window.addEventListener('mira:prompt-suggestion', handler);
		return () => window.removeEventListener('mira:prompt-suggestion', handler);
	});

	$: filteredPrompts = prompts.filter(p => {
		if (!search.trim()) return true;
		const q = search.toLowerCase();
		return p.title?.toLowerCase().includes(q) || p.content?.toLowerCase().includes(q) || p.tags?.some(t => t.toLowerCase().includes(q));
	});

	$: allTags = [...new Set(prompts.flatMap(p => p.tags || []))];

	function addPrompt() {
		if (!newContent.trim()) return;
		const lib = storage.get('ms_prompt_library') || [];
		lib.unshift({
			id: crypto.randomUUID(), title: newTitle || newContent.slice(0, 40), content: newContent,
			tags: newTags.split(',').map(t => t.trim()).filter(Boolean), target: 'Universal',
			createdAt: Date.now(), usedAt: 0, useCount: 0
		});
		storage.set('ms_prompt_library', lib);
		prompts = lib;
		newTitle = ''; newContent = ''; newTags = ''; showAdd = false;
	}

	function deletePrompt(pid) {
		const lib = (storage.get('ms_prompt_library') || []).filter(p => p.id !== pid);
		storage.set('ms_prompt_library', lib);
		prompts = lib;
	}

	function sendToOptimizer(content) {
		input = content;
		tab = 'optimizer';
	}

	function clearAll() {
		input = ''; variantA = ''; variantB = ''; variantC = ''; hasResult = false;
	}

	function handleHistorySelect(e) {
		const item = e.detail;
		input = item.input; target = item.target;
		if (item.variants) {
			[variantA, variantB, variantC] = item.variants;
			hasResult = true;
		}
		tab = 'optimizer';
		showHistory = false;
	}

	const historyRenderer = (item) => ({
		icon: '🔧', title: item.input?.slice(0, 50) || 'Prompt', subtitle: item.target
	});
</script>

<AppShell
	title="Prompt Lab" icon="🔧" credits={2}
	result={hasResult ? variantA : ''}
	{history}
	onExport={() => exportTXT([variantA, variantB, variantC].join('\n\n---\n\n'), 'promptlab-variants.txt')}
	onShare={() => { const link = generateShareLink('promptlab', { input, variants: [variantA, variantB, variantC] }); copyToClipboard(link); notify('Share link copied ✓', 'success'); }}
	onClear={clearAll}
	on:togglehistory={() => showHistory = !showHistory}
>
	<div class="pl-layout">
		<div class="pl-main">
			<!-- Tabs -->
			<div class="pl-tabs">
				<button class="pl-tab" class:active={tab === 'optimizer'} on:click={() => tab = 'optimizer'}>
					{$t('apps.promptlab.tabOptimizer')}
				</button>
				<button class="pl-tab" class:active={tab === 'library'} on:click={() => tab = 'library'}>
					{$t('apps.promptlab.tabLibrary')}
				</button>
			</div>

			{#if tab === 'optimizer'}
				<div class="optimizer">
					<label class="field-label">{$t('apps.promptlab.inputLabel')}</label>
					<textarea class="prompt-input" rows="5" bind:value={input} placeholder={$t('apps.promptlab.inputPlaceholder')}></textarea>

					<label class="field-label">{$t('apps.promptlab.targetLabel')}</label>
					<div class="target-pills">
						{#each TARGETS as tgt}
							<button class="pill" class:active={target === tgt} on:click={() => target = tgt}>{tgt}</button>
						{/each}
					</div>

					<button class="optimize-btn" on:click={optimize} disabled={!input.trim() || loading}>
						{#if loading}⟳ ...{:else}⚡ {$t('apps.promptlab.optimizeBtn')}{/if}
					</button>

					{#if hasResult}
						<div class="variants">
							{#each [{label:'A', tag: $t('apps.promptlab.variantA'), text: variantA}, {label:'B', tag: $t('apps.promptlab.variantB'), text: variantB}, {label:'C', tag: $t('apps.promptlab.variantC'), text: variantC}] as v}
								<div class="variant-card">
									<div class="vc-head">
										<span class="vc-label">{v.label}</span>
										<span class="vc-tag">{v.tag}</span>
									</div>
									<pre class="vc-text">{v.text}</pre>
									<div class="vc-actions">
										<button on:click={() => copyToClipboard(v.text).then(() => notify('Copied ✓', 'success'))}>Copy</button>
										<button on:click={() => saveToLibrary(v.text, v.tag)}>{$t('apps.promptlab.saveToLibrary')}</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

			{:else}
				<div class="library">
					<div class="lib-top">
						<input class="search-input" type="text" bind:value={search} placeholder={$t('apps.promptlab.searchPrompts')} />
						<button class="add-btn" on:click={() => showAdd = !showAdd}>{$t('apps.promptlab.addPrompt')}</button>
					</div>

					{#if allTags.length > 0}
						<div class="tag-pills">
							{#each allTags as tag}
								<button class="pill small" class:active={search === tag} on:click={() => search = search === tag ? '' : tag}>{tag}</button>
							{/each}
						</div>
					{/if}

					{#if showAdd}
						<div class="add-form">
							<input type="text" bind:value={newTitle} placeholder="Title" class="field-input" />
							<textarea bind:value={newContent} placeholder="Prompt content" rows="3" class="field-input"></textarea>
							<input type="text" bind:value={newTags} placeholder="Tags (comma-separated)" class="field-input" />
							<button class="optimize-btn" on:click={addPrompt}>{$t('common.save')}</button>
						</div>
					{/if}

					{#if filteredPrompts.length === 0}
						<p class="empty">{$t('apps.promptlab.libraryEmpty')}</p>
					{:else}
						<div class="prompt-grid">
							{#each filteredPrompts as p (p.id)}
								<div class="prompt-card">
									<div class="pc-head">
										<span class="pc-title">{p.title}</span>
										{#if p.target}<span class="pc-target">{p.target}</span>{/if}
									</div>
									{#if p.tags?.length}
										<div class="pc-tags">{#each p.tags as tag}<span class="pc-tag">{tag}</span>{/each}</div>
									{/if}
									<p class="pc-preview">{p.content?.slice(0, 80)}...</p>
									<div class="pc-actions">
										<button on:click={() => copyToClipboard(p.content).then(() => notify('Copied ✓', 'success'))}>Copy</button>
										<button on:click={() => sendToOptimizer(p.content)}>Optimize</button>
										<button on:click={() => deletePrompt(p.id)}>Delete</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		{#if showHistory}
			<HistorySidebar {history} renderItem={historyRenderer} on:select={handleHistorySelect} />
		{/if}
	</div>
</AppShell>

<style>
	.pl-layout { display: flex; height: 100%; }
	.pl-main { flex: 1; overflow: auto; display: flex; flex-direction: column; gap: 12px; }
	.pl-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); margin: -16px -16px 0; padding: 0 16px; }
	.pl-tab {
		padding: 8px 16px; font-family: var(--font-mono); font-size: 12px;
		background: none; border: none; border-bottom: 2px solid transparent;
		color: var(--text-secondary); cursor: pointer; transition: all var(--transition);
	}
	.pl-tab.active { color: var(--accent); border-bottom-color: var(--accent); }

	.field-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
	.prompt-input, .field-input {
		width: 100%; padding: 10px 12px; background: var(--bg-elevated); border: 1px solid var(--border);
		border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 12px;
		color: var(--text-primary); resize: vertical; outline: none;
	}
	.prompt-input:focus, .field-input:focus { border-color: var(--accent); }

	.target-pills { display: flex; gap: 6px; flex-wrap: wrap; }
	.pill {
		padding: 5px 14px; font-family: var(--font-mono); font-size: 11px;
		background: var(--bg-elevated); border: 1px solid var(--border);
		border-radius: 14px; cursor: pointer; color: var(--text-secondary); transition: all var(--transition);
	}
	.pill.active { border-color: var(--accent); color: var(--accent); background: var(--bg-active); }
	.pill.small { padding: 3px 10px; font-size: 10px; }

	.optimize-btn {
		padding: 10px 0; width: 100%; border-radius: var(--radius-sm); font-family: var(--font-mono);
		font-size: 13px; font-weight: 700; background: var(--accent); color: var(--bg-base);
		border: none; cursor: pointer; transition: opacity var(--transition);
	}
	.optimize-btn:hover:not(:disabled) { opacity: 0.9; }
	.optimize-btn:disabled { opacity: 0.4; cursor: not-allowed; }

	.variants { display: flex; gap: 10px; flex-wrap: wrap; }
	.variant-card {
		flex: 1; min-width: 180px; background: var(--bg-elevated); border: 1px solid var(--border);
		border-radius: var(--radius-md); padding: 12px; display: flex; flex-direction: column; gap: 8px;
	}
	.vc-head { display: flex; align-items: center; gap: 8px; }
	.vc-label { font-size: 14px; font-weight: 700; color: var(--accent); }
	.vc-tag { font-size: 10px; color: var(--text-muted); background: var(--bg-base); padding: 2px 8px; border-radius: var(--radius-sm); }
	.vc-text { font-size: 11px; color: var(--text-primary); line-height: 1.6; white-space: pre-wrap; word-break: break-word; flex: 1; max-height: 200px; overflow: auto; margin: 0; }
	.vc-actions { display: flex; gap: 6px; }
	.vc-actions button {
		font-family: var(--font-mono); font-size: 10px; padding: 3px 10px; background: var(--bg-base);
		border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary); cursor: pointer;
	}
	.vc-actions button:hover { border-color: var(--accent); color: var(--accent); }

	.lib-top { display: flex; gap: 8px; }
	.search-input {
		flex: 1; padding: 8px 12px; background: var(--bg-elevated); border: 1px solid var(--border);
		border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 12px; color: var(--text-primary); outline: none;
	}
	.search-input:focus { border-color: var(--accent); }
	.add-btn {
		padding: 8px 14px; font-family: var(--font-mono); font-size: 11px; background: var(--accent);
		color: var(--bg-base); border: none; border-radius: var(--radius-sm); cursor: pointer; font-weight: 600; white-space: nowrap;
	}
	.tag-pills { display: flex; gap: 4px; flex-wrap: wrap; }
	.add-form { display: flex; flex-direction: column; gap: 8px; padding: 12px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-md); }
	.prompt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
	.prompt-card { padding: 12px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 6px; }
	.pc-head { display: flex; align-items: center; gap: 8px; }
	.pc-title { font-size: 12px; font-weight: 600; color: var(--text-primary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.pc-target { font-size: 9px; color: var(--accent); background: var(--bg-active); padding: 1px 6px; border-radius: var(--radius-sm); }
	.pc-tags { display: flex; gap: 4px; flex-wrap: wrap; }
	.pc-tag { font-size: 9px; color: var(--text-muted); background: var(--bg-base); padding: 1px 6px; border-radius: var(--radius-sm); }
	.pc-preview { font-size: 11px; color: var(--text-muted); line-height: 1.5; margin: 0; }
	.pc-actions { display: flex; gap: 6px; }
	.pc-actions button { font-family: var(--font-mono); font-size: 10px; padding: 2px 8px; background: none; border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary); cursor: pointer; }
	.pc-actions button:hover { border-color: var(--accent); color: var(--accent); }
	.empty { font-size: 12px; color: var(--text-muted); text-align: center; padding: 40px 0; }
</style>
