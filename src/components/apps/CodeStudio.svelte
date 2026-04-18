<script>
	import { onMount, tick } from 'svelte';
	import { t } from '$lib/i18n/index.js';
	import { apiKeys, ollamaModels, ollamaStatus } from '$lib/stores/models.js';
	import { notify } from '$lib/stores/os.js';
	import AppShell from './shared/AppShell.svelte';

	export const id = 'codestudio';

	// ── Supported languages ──────────────────────────────────────────────
	const LANGUAGES = [
		{ id: 'javascript', label: 'JavaScript', ext: 'js' },
		{ id: 'typescript', label: 'TypeScript', ext: 'ts' },
		{ id: 'python',     label: 'Python',     ext: 'py' },
		{ id: 'html',       label: 'HTML',        ext: 'html' },
		{ id: 'css',        label: 'CSS',         ext: 'css' },
		{ id: 'json',       label: 'JSON',        ext: 'json' },
		{ id: 'sql',        label: 'SQL',         ext: 'sql' },
		{ id: 'bash',       label: 'Bash',        ext: 'sh' },
		{ id: 'rust',       label: 'Rust',        ext: 'rs' },
		{ id: 'go',         label: 'Go',          ext: 'go' },
		{ id: 'java',       label: 'Java',        ext: 'java' },
		{ id: 'plaintext',  label: 'Plain Text',  ext: 'txt' }
	];

	// ── Code models ───────────────────────────────────────────────────────
	const CODE_MODELS = [
		{ provider: 'groq',      model: 'llama-3.3-70b-versatile',     label: '⚡ Llama 3.3 70B (Groq)' },
		{ provider: 'groq',      model: 'qwen-2.5-coder-32b-instruct', label: '⚡ Qwen 2.5 Coder 32B (Groq)' },
		{ provider: 'anthropic', model: 'claude-sonnet-4-5-20251001',   label: '🔷 Claude Sonnet 4.5' },
		{ provider: 'openai',    model: 'gpt-4o',                       label: '🌐 GPT-4o' },
		{ provider: 'openai',    model: 'o4-mini',                      label: '🌐 o4-mini' },
		{ provider: 'ollama',    model: '__ollama__',                    label: '🤖 Local (Ollama)' }
	];

	// ── State ─────────────────────────────────────────────────────────────
	let code = '';
	let lang = LANGUAGES[0];
	let viewMode = 'edit'; // 'edit' | 'preview'
	let aiPrompt = '';
	let selectedModelKey = '';
	let loading = false;
	let editorEl;
	let previewEl;
	let hljs = null;
	let tabs = [{ id: 1, name: 'main.js', lang: LANGUAGES[0], code: '' }];
	let activeTabId = 1;
	let tabCounter = 2;

	// ── Computed ──────────────────────────────────────────────────────────
	$: keys = $apiKeys;
	$: ollamaOnline = $ollamaStatus === 'online';
	$: ollamaModelList = $ollamaModels;

	$: availableModels = CODE_MODELS.filter(m => {
		if (m.provider === 'ollama') return ollamaOnline && ollamaModelList.length > 0;
		return !!keys[m.provider]?.trim();
	});

	$: if (!selectedModelKey && availableModels.length > 0) {
		selectedModelKey = availableModels[0].provider + ':' + availableModels[0].model;
	}

	$: activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

	// sync code↔tab
	$: if (activeTab) {
		code = activeTab.code;
		lang = activeTab.lang;
	}

	function saveActiveTab() {
		tabs = tabs.map(t => t.id === activeTabId ? { ...t, code, lang } : t);
	}

	// ── Highlight.js ──────────────────────────────────────────────────────
	onMount(async () => {
		try {
			const mod = await import('highlight.js/lib/core');
			hljs = mod.default;
			// Register common languages
			const [js, ts, py, html, css, json, sql, bash, rust, go, java] = await Promise.all([
				import('highlight.js/lib/languages/javascript'),
				import('highlight.js/lib/languages/typescript'),
				import('highlight.js/lib/languages/python'),
				import('highlight.js/lib/languages/xml'),
				import('highlight.js/lib/languages/css'),
				import('highlight.js/lib/languages/json'),
				import('highlight.js/lib/languages/sql'),
				import('highlight.js/lib/languages/bash'),
				import('highlight.js/lib/languages/rust'),
				import('highlight.js/lib/languages/go'),
				import('highlight.js/lib/languages/java')
			]);
			hljs.registerLanguage('javascript', js.default);
			hljs.registerLanguage('typescript', ts.default);
			hljs.registerLanguage('python', py.default);
			hljs.registerLanguage('html', html.default);
			hljs.registerLanguage('xml', html.default);
			hljs.registerLanguage('css', css.default);
			hljs.registerLanguage('json', json.default);
			hljs.registerLanguage('sql', sql.default);
			hljs.registerLanguage('bash', bash.default);
			hljs.registerLanguage('rust', rust.default);
			hljs.registerLanguage('go', go.default);
			hljs.registerLanguage('java', java.default);
		} catch { /* highlight.js not available */ }
	});

	$: highlightedCode = (() => {
		if (!hljs || !code) return escapeHtml(code);
		try {
			const langId = lang.id === 'html' ? 'xml' : lang.id;
			if (lang.id === 'plaintext') return escapeHtml(code);
			return hljs.highlight(code, { language: langId }).value;
		} catch {
			return escapeHtml(code);
		}
	})();

	function escapeHtml(s) {
		return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	// ── Tab management ────────────────────────────────────────────────────
	function addTab() {
		saveActiveTab();
		const newLang = LANGUAGES[0];
		const tab = { id: tabCounter++, name: `file${tabCounter - 1}.${newLang.ext}`, lang: newLang, code: '' };
		tabs = [...tabs, tab];
		activeTabId = tab.id;
		code = '';
		lang = newLang;
	}

	function closeTab(tabId) {
		if (tabs.length === 1) return;
		saveActiveTab();
		tabs = tabs.filter(t => t.id !== tabId);
		if (activeTabId === tabId) {
			activeTabId = tabs[0].id;
			code = tabs[0].code;
			lang = tabs[0].lang;
		}
	}

	function switchTab(tabId) {
		saveActiveTab();
		activeTabId = tabId;
		const t = tabs.find(x => x.id === tabId);
		code = t.code;
		lang = t.lang;
	}

	function renameTab(tabId, newName) {
		tabs = tabs.map(t => t.id === tabId ? { ...t, name: newName } : t);
	}

	function onCodeInput() {
		saveActiveTab();
	}

	function changeLang(newLangId) {
		const nl = LANGUAGES.find(l => l.id === newLangId) || LANGUAGES[0];
		lang = nl;
		const baseName = activeTab.name.split('.').slice(0, -1).join('.') || activeTab.name;
		tabs = tabs.map(t => t.id === activeTabId ? { ...t, lang: nl, name: `${baseName}.${nl.ext}` } : t);
	}

	// ── Clipboard ─────────────────────────────────────────────────────────
	async function cut() {
		if (!editorEl) return;
		const start = editorEl.selectionStart;
		const end = editorEl.selectionEnd;
		const selected = code.slice(start, end);
		if (!selected) return;
		await navigator.clipboard.writeText(selected);
		code = code.slice(0, start) + code.slice(end);
		saveActiveTab();
		await tick();
		editorEl.setSelectionRange(start, start);
	}

	async function copy() {
		if (!editorEl) return;
		const start = editorEl.selectionStart;
		const end = editorEl.selectionEnd;
		const selected = start !== end ? code.slice(start, end) : code;
		await navigator.clipboard.writeText(selected);
		notify('Copied to clipboard', 'success');
	}

	async function paste() {
		if (!editorEl) return;
		const text = await navigator.clipboard.readText();
		const start = editorEl.selectionStart;
		const end = editorEl.selectionEnd;
		code = code.slice(0, start) + text + code.slice(end);
		saveActiveTab();
		await tick();
		const cur = start + text.length;
		editorEl.setSelectionRange(cur, cur);
	}

	function clear() {
		code = '';
		saveActiveTab();
	}

	// ── Download ──────────────────────────────────────────────────────────
	function download() {
		const filename = activeTab.name || `code.${lang.ext}`;
		const blob = new Blob([code], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	// ── AI Generation ─────────────────────────────────────────────────────
	async function generateCode() {
		if (!aiPrompt.trim() || loading) return;
		const [selProvider, selModel] = selectedModelKey.split(':');
		if (!selProvider) {
			notify('No model selected or API key missing', 'error');
			return;
		}

		loading = true;

		const currentCode = code.trim();
		const systemPrompt = `You are an expert ${lang.label} programmer in a code editor called Code Studio (Molvicos OS).
RULES:
- Output ONLY code. No explanations, no markdown code fences, no commentary.
- Return pure ${lang.label} code that can be directly used.
- If the user asks to modify existing code, return the complete modified version.
- Do not wrap in \`\`\` or any markdown.`;

		const userMsg = currentCode
			? `Existing code:\n${currentCode}\n\nInstruction: ${aiPrompt}`
			: aiPrompt;

		try {
			let apiKey = keys[selProvider];
			let modelId = selModel;

			if (selProvider === 'ollama') {
				modelId = ollamaModelList[0]?.name || '';
			}

			const res = await fetch('/api/ai', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					provider: selProvider,
					apiKey: apiKey || null,
					model: modelId,
					system: systemPrompt,
					messages: [{ role: 'user', content: userMsg }],
					temperature: 0.2,
					stream: true
				})
			});

			if (!res.ok) {
				const err = await res.text();
				notify(`AI error: ${err}`, 'error');
				loading = false;
				return;
			}

			// Stream the response
			code = '';
			saveActiveTab();
			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const data = line.slice(6).trim();
						if (data === '[DONE]') break;
						try {
							const json = JSON.parse(data);
							const delta =
								json.choices?.[0]?.delta?.content ||
								json.content?.[0]?.text || '';
							if (delta) {
								code += delta;
								saveActiveTab();
							}
						} catch { /* skip */ }
					}
				}
			}

			// Strip any accidental markdown fences the model added
			code = code.replace(/^```[\w]*\n?/m, '').replace(/\n?```$/m, '').trim();
			saveActiveTab();
			aiPrompt = '';
		} catch (e) {
			notify(`Error: ${e.message}`, 'error');
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e) {
		// Tab → insert spaces instead of losing focus
		if (e.key === 'Tab') {
			e.preventDefault();
			const start = e.target.selectionStart;
			const end = e.target.selectionEnd;
			code = code.slice(0, start) + '\t' + code.slice(end);
			saveActiveTab();
			tick().then(() => {
				e.target.selectionStart = e.target.selectionEnd = start + 1;
			});
		}
	}

	function handlePromptKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			generateCode();
		}
	}

	// ── Line numbers ──────────────────────────────────────────────────────
	$: lineCount = (code.match(/\n/g) || []).length + 1;
	$: lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);
</script>

<AppShell
	title={$t('apps.codestudio.name')}
	icon="🖥️"
	credits={2}
	{code}
	onExport={download}
	onClear={clear}
>
	<div class="codestudio">
		<!-- ── Tab Bar ──────────────────────────────── -->
		<div class="tab-bar">
			<div class="tabs-scroll">
				{#each tabs as tab (tab.id)}
					<button
						class="tab-item"
						class:active={tab.id === activeTabId}
						on:click={() => switchTab(tab.id)}
					>
						<span class="tab-name">{tab.name}</span>
						{#if tabs.length > 1}
							<span
								class="tab-close"
								role="button"
								tabindex="0"
								on:click|stopPropagation={() => closeTab(tab.id)}
								on:keydown={(e) => e.key === 'Enter' && closeTab(tab.id)}
							>×</span>
						{/if}
					</button>
				{/each}
			</div>
			<button class="tab-add" on:click={addTab} title="New file">+</button>
		</div>

		<!-- ── Toolbar ─────────────────────────────── -->
		<div class="toolbar">
			<div class="toolbar-left">
				<button class="tb-action" on:click={cut} title="Cut">✂</button>
				<button class="tb-action" on:click={copy} title="Copy">⎘</button>
				<button class="tb-action" on:click={paste} title="Paste">⎗</button>
				<div class="tb-sep"></div>
				<select
					class="lang-select"
					value={lang.id}
					on:change={(e) => changeLang(e.target.value)}
				>
					{#each LANGUAGES as l}
						<option value={l.id}>{l.label}</option>
					{/each}
				</select>
			</div>
			<div class="toolbar-right">
				<button
					class="tb-mode"
					class:active={viewMode === 'edit'}
					on:click={() => viewMode = 'edit'}
				>{$t('apps.codestudio.edit')}</button>
				<button
					class="tb-mode"
					class:active={viewMode === 'preview'}
					on:click={() => viewMode = 'preview'}
				>{$t('apps.codestudio.preview')}</button>
				<button class="tb-action download" on:click={download} title={$t('apps.codestudio.download')}>⬇ {lang.ext}</button>
			</div>
		</div>

		<!-- ── Main layout ─────────────────────────── -->
		<div class="main-layout">
			<!-- Editor / Preview -->
			<div class="editor-panel">
				{#if viewMode === 'edit'}
					<div class="editor-wrap">
						<div class="line-numbers" aria-hidden="true">
							{#each lineNumbers as n}
								<span>{n}</span>
							{/each}
						</div>
						<textarea
							bind:this={editorEl}
							bind:value={code}
							on:input={onCodeInput}
							on:keydown={handleKeydown}
							spellcheck="false"
							autocorrect="off"
							autocapitalize="off"
							class="code-textarea"
							placeholder={$t('apps.codestudio.editorPlaceholder')}
						></textarea>
					</div>
				{:else}
					<div class="preview-wrap">
						<pre class="hljs"><code bind:this={previewEl}>{@html highlightedCode || $t('apps.codestudio.noCode')}</code></pre>
					</div>
				{/if}
			</div>

			<!-- AI Side Panel -->
			<div class="ai-panel">
				<div class="ai-header">
					<span class="ai-icon">✦</span>
					<span class="ai-title">{$t('apps.codestudio.aiGenerate')}</span>
				</div>

				<div class="ai-body">
					<label class="ai-label">{$t('apps.codestudio.modelLabel')}</label>
					{#if availableModels.length === 0}
						<p class="ai-no-key">{$t('apps.codestudio.noKey')}</p>
					{:else}
						<select class="ai-model-select" bind:value={selectedModelKey}>
							{#each availableModels as m}
								<option value="{m.provider}:{m.model}">{m.label}</option>
							{/each}
						</select>
					{/if}

					<label class="ai-label">{$t('apps.codestudio.promptLabel')}</label>
					<textarea
						class="ai-prompt"
						bind:value={aiPrompt}
						on:keydown={handlePromptKeydown}
						placeholder={$t('apps.codestudio.promptPlaceholder')}
						rows="4"
						disabled={loading}
					></textarea>

					<button
						class="ai-generate"
						disabled={!aiPrompt.trim() || loading || availableModels.length === 0}
						on:click={generateCode}
					>
						{#if loading}
							<span class="gen-dots"><span></span><span></span><span></span></span>
							{$t('apps.codestudio.generating')}
						{:else}
							↑ {$t('apps.codestudio.generateBtn')}
						{/if}
					</button>

					<div class="ai-hint">{$t('apps.codestudio.aiHint')}</div>
				</div>
			</div>
		</div>
	</div>
</AppShell>

<style>
	/* ── Base ─────────────────────────────────── */
	.codestudio {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
		padding: 0;
	}

	/* ── Tab bar ─────────────────────────────── */
	.tab-bar {
		display: flex;
		align-items: center;
		border-bottom: 1px solid var(--border);
		background: var(--bg-elevated);
		flex-shrink: 0;
		overflow: hidden;
	}

	.tabs-scroll {
		display: flex;
		overflow-x: auto;
		scrollbar-width: none;
		flex: 1;
	}

	.tabs-scroll::-webkit-scrollbar { display: none; }

	.tab-item {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 0 12px;
		height: 32px;
		border: none;
		border-right: 1px solid var(--border);
		background: transparent;
		color: var(--text-muted);
		font-family: var(--font-mono);
		font-size: 11px;
		cursor: pointer;
		white-space: nowrap;
		flex-shrink: 0;
		transition: all var(--transition);
	}

	.tab-item.active {
		background: var(--bg-base);
		color: var(--text-primary);
		border-bottom: 2px solid var(--accent);
	}

	.tab-close {
		opacity: 0.5;
		font-size: 14px;
		line-height: 1;
		cursor: pointer;
	}

	.tab-close:hover { opacity: 1; }

	.tab-add {
		width: 32px;
		height: 32px;
		border: none;
		border-left: 1px solid var(--border);
		background: transparent;
		color: var(--text-muted);
		font-size: 18px;
		cursor: pointer;
		flex-shrink: 0;
		transition: all var(--transition);
	}

	.tab-add:hover { color: var(--accent); }

	/* ── Toolbar ─────────────────────────────── */
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 4px 8px;
		border-bottom: 1px solid var(--border);
		background: var(--bg-elevated);
		flex-shrink: 0;
		gap: 8px;
		flex-wrap: wrap;
	}

	.toolbar-left, .toolbar-right {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.tb-action {
		padding: 3px 8px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: transparent;
		color: var(--text-secondary);
		font-size: 13px;
		cursor: pointer;
		transition: all var(--transition);
		font-family: var(--font-mono);
	}

	.tb-action:hover {
		border-color: var(--accent);
		color: var(--text-primary);
	}

	.tb-action.download {
		padding: 3px 10px;
		font-size: 11px;
		background: var(--bg-active);
		color: var(--accent);
		border-color: var(--accent);
	}

	.tb-sep {
		width: 1px;
		height: 18px;
		background: var(--border);
		margin: 0 4px;
	}

	.lang-select {
		padding: 3px 6px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: var(--bg-elevated);
		color: var(--text-secondary);
		font-family: var(--font-mono);
		font-size: 11px;
		cursor: pointer;
	}

	.tb-mode {
		padding: 3px 8px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: transparent;
		color: var(--text-muted);
		font-family: var(--font-mono);
		font-size: 11px;
		cursor: pointer;
		transition: all var(--transition);
	}

	.tb-mode.active {
		background: var(--accent);
		color: var(--bg-base);
		border-color: var(--accent);
	}

	/* ── Main layout ─────────────────────────── */
	.main-layout {
		display: flex;
		flex: 1;
		overflow: hidden;
		gap: 0;
	}

	/* ── Editor ──────────────────────────────── */
	.editor-panel {
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		border-right: 1px solid var(--border);
	}

	.editor-wrap {
		display: flex;
		flex: 1;
		overflow: auto;
		font-family: var(--font-mono);
		font-size: 13px;
	}

	.line-numbers {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		padding: 12px 8px;
		background: var(--bg-elevated);
		border-right: 1px solid var(--border);
		color: var(--text-muted);
		font-size: 12px;
		font-family: var(--font-mono);
		user-select: none;
		min-width: 36px;
		flex-shrink: 0;
		line-height: 1.6;
	}

	.code-textarea {
		flex: 1;
		padding: 12px;
		background: var(--bg-base);
		color: var(--text-primary);
		font-family: var(--font-mono);
		font-size: 13px;
		line-height: 1.6;
		border: none;
		resize: none;
		outline: none;
		tab-size: 2;
		white-space: pre;
		overflow-wrap: normal;
		overflow-x: auto;
	}

	.preview-wrap {
		flex: 1;
		overflow: auto;
		padding: 12px;
		background: var(--bg-base);
	}

	pre.hljs {
		margin: 0;
		padding: 0;
		background: transparent;
		font-family: var(--font-mono);
		font-size: 13px;
		line-height: 1.6;
		white-space: pre;
		overflow-x: auto;
	}

	/* Highlight.js theme overrides using CSS variables */
	pre.hljs :global(.hljs-keyword)    { color: #c792ea; }
	pre.hljs :global(.hljs-string)     { color: #c3e88d; }
	pre.hljs :global(.hljs-number)     { color: #f78c6c; }
	pre.hljs :global(.hljs-comment)    { color: #546e7a; font-style: italic; }
	pre.hljs :global(.hljs-function)   { color: #82aaff; }
	pre.hljs :global(.hljs-title)      { color: #82aaff; }
	pre.hljs :global(.hljs-built_in)   { color: #89ddff; }
	pre.hljs :global(.hljs-type)       { color: #ffcb6b; }
	pre.hljs :global(.hljs-attr)       { color: #ffcb6b; }
	pre.hljs :global(.hljs-variable)   { color: var(--text-primary); }
	pre.hljs :global(.hljs-tag)        { color: #f07178; }
	pre.hljs :global(.hljs-name)       { color: #f07178; }
	pre.hljs :global(.hljs-selector-tag) { color: #c792ea; }
	pre.hljs :global(.hljs-literal)    { color: #ff5370; }
	pre.hljs :global(.hljs-property)   { color: #f07178; }
	pre.hljs :global(.hljs-meta)       { color: #89ddff; }
	pre.hljs :global(.hljs-punctuation){ color: var(--text-secondary); }

	/* ── AI Panel ────────────────────────────── */
	.ai-panel {
		width: 220px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		background: var(--bg-elevated);
		overflow-y: auto;
	}

	.ai-header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 12px;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}

	.ai-icon { font-size: 14px; color: var(--accent); }

	.ai-title {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-primary);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.ai-body {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px;
		flex: 1;
	}

	.ai-label {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.ai-model-select {
		width: 100%;
		padding: 6px 8px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: var(--bg-base);
		color: var(--text-primary);
		font-family: var(--font-mono);
		font-size: 11px;
	}

	.ai-no-key {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--text-muted);
		text-align: center;
		padding: 8px 0;
	}

	.ai-prompt {
		width: 100%;
		padding: 8px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: var(--bg-base);
		color: var(--text-primary);
		font-family: var(--font-mono);
		font-size: 12px;
		resize: none;
		outline: none;
		line-height: 1.5;
		box-sizing: border-box;
		transition: border-color var(--transition);
	}

	.ai-prompt:focus { border-color: var(--accent); }

	.ai-generate {
		width: 100%;
		padding: 8px 12px;
		border-radius: var(--radius-md);
		border: none;
		background: var(--accent);
		color: var(--bg-base);
		font-family: var(--font-mono);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: opacity var(--transition);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
	}

	.ai-generate:disabled { opacity: 0.4; cursor: not-allowed; }
	.ai-generate:not(:disabled):hover { opacity: 0.85; }

	.gen-dots {
		display: flex;
		gap: 3px;
	}

	.gen-dots span {
		width: 4px;
		height: 4px;
		background: var(--bg-base);
		border-radius: 50%;
		animation: gdot 0.9s infinite;
	}

	.gen-dots span:nth-child(2) { animation-delay: 0.15s; }
	.gen-dots span:nth-child(3) { animation-delay: 0.3s; }

	@keyframes gdot {
		0%, 80%, 100% { transform: scale(1); }
		40% { transform: scale(1.4); }
	}

	.ai-hint {
		font-family: var(--font-mono);
		font-size: 9px;
		color: var(--text-muted);
		text-align: center;
		line-height: 1.5;
	}

	/* ── Mobile ──────────────────────────────── */
	@media (max-width: 600px) {
		.main-layout {
			flex-direction: column;
		}

		.editor-panel {
			border-right: none;
			border-bottom: 1px solid var(--border);
			min-height: 40vh;
		}

		.ai-panel {
			width: 100%;
			min-height: 220px;
			max-height: 40vh;
		}

		.toolbar {
			flex-wrap: nowrap;
			overflow-x: auto;
		}

		.toolbar-left, .toolbar-right {
			flex-shrink: 0;
		}
	}
</style>
