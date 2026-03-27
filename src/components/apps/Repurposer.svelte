<script>
	import { t } from '$lib/i18n/index.js';
	import { currentLang } from '$lib/i18n/index.js';
	import { streamAI } from '$lib/ai/stream.js';
	import { getActiveProvider } from '$lib/providers/active.js';
	import { userProfile } from '$lib/stores/user.js';
	import { createAppHistory } from '$lib/stores/history.js';
	import { notify } from '$lib/stores/os.js';
	import { copyToClipboard, exportTXT, generateShareLink } from '$lib/utils/export.js';
	import AppShell from './shared/AppShell.svelte';
	import HistorySidebar from './shared/HistorySidebar.svelte';

	export let id = 'repurposer';

	let showHistory = false;
	const history = createAppHistory('repurposer');

	let input = '';
	let loading = false;
	let activeTab = 'tweet';
	let outputLang = 'en';

	const FORMATS = [
		{ id: 'tweet', label: 'Tweet Thread', icon: '𝕏', desc: '5-tweet thread with hook + value + CTA', system: 'You are a viral Twitter/X content creator. Transform the input into a 5-tweet thread. Tweet 1: compelling hook. Tweets 2-4: key insights (one per tweet, max 280 chars each). Tweet 5: CTA. Format as: 1/ ... 2/ ... etc.' },
		{ id: 'linkedin', label: 'LinkedIn Post', icon: 'in', desc: 'Professional post with hook + insights', system: 'You are a LinkedIn content expert. Transform the input into a high-performing LinkedIn post: strong opening line (no "I am excited to..."), 3-5 key insights with line breaks for readability, relevant hashtags at the end. Max 1300 chars.' },
		{ id: 'email', label: 'Email Newsletter', icon: '✉', desc: 'Newsletter-ready section with subject', system: 'You are an email newsletter writer. Transform the input into a newsletter section with: subject line, preview text, intro paragraph, 3 key takeaways as bullet points, and a closing sentence. Conversational but professional tone.' },
		{ id: 'seo', label: 'SEO Meta', icon: '🔍', desc: 'Title tag + meta description + slug', system: 'You are an SEO specialist. From the input, generate: 1) SEO title tag (50-60 chars, keyword-first), 2) Meta description (150-160 chars, includes CTA), 3) URL slug (lowercase, hyphens, max 5 words). Format as labeled sections.' },
		{ id: 'tiktok', label: 'TikTok Script', icon: '▶', desc: '60-second video script with hooks', system: 'You are a TikTok content creator. Transform the input into a 60-second video script: hook (0-3s, question or bold statement), main content (3-50s, conversational, 3 key points), outro (50-60s, CTA + "follow for more"). Include [VISUAL] stage directions.' },
		{ id: 'summary', label: 'Executive Summary', icon: '📋', desc: 'TL;DR + 3 key points + action items', system: 'You are an executive communication expert. Transform the input into: TL;DR (1 sentence), 3 Key Points (bullet list), and 3 Action Items. Use clear, direct language. No filler.' }
	];

	const LANG_INSTRUCTIONS = {
		en: 'Respond in English.', es: 'Responde en español.', de: 'Antworte auf Deutsch.',
		fr: 'Réponds en français.', zh: '用中文回答。'
	};

	let selected = FORMATS.map(f => f.id);
	let results = {};

	$: wordCount = input.trim().split(/\s+/).filter(Boolean).length;
	$: currentLangVal = $currentLang;

	function toggleFormat(fid) {
		if (selected.includes(fid)) selected = selected.filter(s => s !== fid);
		else selected = [...selected, fid];
	}

	function selectAll() { selected = FORMATS.map(f => f.id); }
	function selectNone() { selected = []; }

	async function repurpose() {
		if (!input.trim() || selected.length === 0 || loading) return;
		if (!getActiveProvider()) { notify($t('mira.noApiKey'), 'error'); return; }
		loading = true;
		results = {};

		const langSuffix = LANG_INSTRUCTIONS[outputLang] || LANG_INSTRUCTIONS.en;

		await Promise.all(
			selected.map(fid => {
				const fmt = FORMATS.find(f => f.id === fid);
				results[fid] = '';
				return streamAI({
					system: fmt.system + '\n\n' + langSuffix,
					messages: [{ role: 'user', content: input }],
					action: 'repurposer',
					onChunk: (_, full) => { results[fid] = full; results = results; },
					onDone: (full) => { results[fid] = full; results = results; },
					onError: (e) => { results[fid] = `Error: ${e}`; results = results; }
				});
			})
		);

		loading = false;
		activeTab = selected[0] || 'tweet';
		history.add({ inputSnippet: input.slice(0, 100), formats: selected, outputLang, results });
	}

	function clearAll() { input = ''; results = {}; }

	function handleHistorySelect(e) {
		const item = e.detail;
		results = item.results || {};
		activeTab = Object.keys(results)[0] || 'tweet';
		showHistory = false;
	}

	const historyRenderer = (item) => ({
		icon: '📝', title: item.inputSnippet || 'Content', subtitle: `${item.formats?.length || 0} formats`
	});
</script>

<AppShell
	title="Repurposer" icon="📝" credits={3}
	result={Object.keys(results).length > 0 ? 'yes' : ''}
	{history}
	onExport={() => { const all = Object.entries(results).map(([k, v]) => `--- ${k.toUpperCase()} ---\n${v}`).join('\n\n'); exportTXT(all, 'repurposed-content.txt'); }}
	onShare={() => { const link = generateShareLink('repurposer', results); copyToClipboard(link); notify('Share link copied ✓', 'success'); }}
	onClear={clearAll}
	on:togglehistory={() => showHistory = !showHistory}
>
	<div class="rp-layout">
		<div class="rp-main">
			<div class="rp-split">
				<!-- Left panel -->
				<div class="rp-left">
					<label class="field-label">{$t('apps.repurposer.inputLabel')}</label>
					<textarea class="rp-input" rows="8" bind:value={input} placeholder={$t('apps.repurposer.inputPlaceholder')}></textarea>
					<div class="word-count" class:warn={wordCount > 400}>
						{$t('apps.repurposer.wordCount').replace('{n}', wordCount)}
					</div>

					<label class="field-label">Formats</label>
					<div class="format-select">
						<div class="fmt-toggle">
							<button class="link-btn" on:click={selectAll}>{$t('apps.repurposer.selectAll')}</button>
							<button class="link-btn" on:click={selectNone}>{$t('apps.repurposer.selectNone')}</button>
						</div>
						{#each FORMATS as fmt}
							<label class="fmt-check">
								<input type="checkbox" checked={selected.includes(fmt.id)} on:change={() => toggleFormat(fmt.id)} />
								<span class="fmt-icon">{fmt.icon}</span>
								<span>{fmt.label}</span>
							</label>
						{/each}
					</div>

					<label class="field-label">{$t('apps.repurposer.outputLang')}</label>
					<div class="lang-pills">
						{#each ['en', 'es', 'de', 'fr', 'zh'] as lang}
							<button class="pill" class:active={outputLang === lang} on:click={() => outputLang = lang}>{lang.toUpperCase()}</button>
						{/each}
					</div>

					<button class="action-btn" on:click={repurpose} disabled={!input.trim() || selected.length === 0 || loading}>
						{#if loading}⟳ ...{:else}✨ {$t('apps.repurposer.repurposeBtn')}{/if}
					</button>
				</div>

				<!-- Right panel -->
				<div class="rp-right">
					{#if Object.keys(results).length > 0}
						<div class="result-tabs">
							{#each selected as fid}
								{@const fmt = FORMATS.find(f => f.id === fid)}
								<button class="r-tab" class:active={activeTab === fid} on:click={() => activeTab = fid}>
									<span class="r-tab-icon">{fmt?.icon}</span>
									{fmt?.label}
								</button>
							{/each}
						</div>
						<div class="result-area">
							<pre class="result-text">{results[activeTab] || ''}</pre>
							<div class="result-actions">
								<button class="sm-btn" on:click={() => copyToClipboard(results[activeTab] || '').then(() => notify('Copied ✓', 'success'))}>Copy</button>
								<button class="sm-btn" on:click={() => exportTXT(results[activeTab] || '', `repurposed-${activeTab}.txt`)}>Export</button>
							</div>
						</div>
					{:else}
						<div class="empty-right">
							<span class="empty-icon">📝</span>
							<p>Paste content and select formats to start repurposing</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

		{#if showHistory}
			<HistorySidebar {history} renderItem={historyRenderer} on:select={handleHistorySelect} />
		{/if}
	</div>
</AppShell>

<style>
	.rp-layout { display: flex; height: 100%; }
	.rp-main { flex: 1; overflow: auto; }
	.rp-split { display: flex; height: 100%; gap: 0; }
	.rp-left { width: 40%; padding: 12px; display: flex; flex-direction: column; gap: 10px; border-right: 1px solid var(--border); overflow: auto; }
	.rp-right { width: 60%; display: flex; flex-direction: column; overflow: hidden; }

	.field-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
	.rp-input {
		width: 100%; padding: 10px 12px; background: var(--bg-elevated); border: 1px solid var(--border);
		border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 12px;
		color: var(--text-primary); resize: vertical; outline: none;
	}
	.rp-input:focus { border-color: var(--accent); }
	.word-count { font-size: 10px; color: var(--text-muted); text-align: right; }
	.word-count.warn { color: #ffa500; }

	.format-select { display: flex; flex-direction: column; gap: 4px; }
	.fmt-toggle { display: flex; gap: 8px; margin-bottom: 4px; }
	.link-btn { background: none; border: none; color: var(--accent); font-family: var(--font-mono); font-size: 10px; cursor: pointer; text-decoration: underline; padding: 0; }
	.fmt-check { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-secondary); cursor: pointer; }
	.fmt-check input { accent-color: var(--accent); }
	.fmt-icon { font-size: 13px; }

	.lang-pills { display: flex; gap: 4px; }
	.pill { padding: 4px 10px; font-family: var(--font-mono); font-size: 10px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 12px; color: var(--text-secondary); cursor: pointer; }
	.pill.active { border-color: var(--accent); color: var(--accent); background: var(--bg-active); }

	.action-btn {
		padding: 10px; width: 100%; border-radius: var(--radius-sm); font-family: var(--font-mono);
		font-size: 12px; font-weight: 700; background: var(--accent); color: var(--bg-base);
		border: none; cursor: pointer;
	}
	.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

	.result-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); overflow-x: auto; flex-shrink: 0; }
	.r-tab {
		padding: 8px 12px; font-family: var(--font-mono); font-size: 11px; background: none;
		border: none; border-bottom: 2px solid transparent; color: var(--text-secondary);
		cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 4px;
	}
	.r-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
	.r-tab-icon { font-size: 12px; }

	.result-area { flex: 1; overflow: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
	.result-text { font-family: var(--font-mono); font-size: 12px; color: var(--text-primary); line-height: 1.7; white-space: pre-wrap; word-break: break-word; margin: 0; flex: 1; }
	.result-actions { display: flex; gap: 6px; flex-shrink: 0; }
	.sm-btn { font-family: var(--font-mono); font-size: 10px; padding: 4px 10px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary); cursor: pointer; }
	.sm-btn:hover { border-color: var(--accent); color: var(--accent); }

	.empty-right { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: var(--text-muted); }
	.empty-icon { font-size: 32px; opacity: 0.3; }
	.empty-right p { font-family: var(--font-mono); font-size: 11px; text-align: center; max-width: 200px; }
</style>
