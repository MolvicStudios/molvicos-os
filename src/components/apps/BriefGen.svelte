<script>
	import { t } from '$lib/i18n/index.js';
	import { currentLang } from '$lib/i18n/index.js';
	import { streamAI } from '$lib/ai/stream.js';
	import { getActiveProvider } from '$lib/providers/active.js';
	import { userProfile } from '$lib/stores/user.js';
	import { createAppHistory } from '$lib/stores/history.js';
	import { notify } from '$lib/stores/os.js';
	import { copyToClipboard, exportTXT, exportPDF, generateShareLink } from '$lib/utils/export.js';
	import AppShell from './shared/AppShell.svelte';
	import HistorySidebar from './shared/HistorySidebar.svelte';

	export let id = 'briefgen';

	let showHistory = false;
	const history = createAppHistory('briefgen');

	let keyword = '';
	let secondaryKeywords = '';
	let contentType = 'Blog';
	let audience = '';
	let competitors = '';
	let outputLang = 'en';
	let wordTarget = '1200';
	let loading = false;
	let result = '';
	let sections = [];

	const CONTENT_TYPES = ['Blog', 'Landing Page', 'Product Page', 'Comparison'];
	const WORD_TARGETS = ['800', '1200', '2000', '3000+'];

	const LANG_INSTRUCTIONS = {
		en: 'Write the entire brief in English.',
		es: 'Escribe todo el brief en español.',
		de: 'Schreibe das gesamte Brief auf Deutsch.',
		fr: 'Rédige tout le brief en français.',
		zh: '用中文撰写整个简报。'
	};

	const BRIEF_SYSTEM = `You are an expert SEO content strategist. Generate a comprehensive content brief with these 11 sections as markdown:

## 1. Content Overview
Brief summary of the content piece, its purpose, and target outcome.

## 2. Target Audience
Demographics, intent, pain points, knowledge level.

## 3. Primary Keyword
Main keyword with search intent analysis and difficulty assessment.

## 4. Secondary Keywords
List of 8-12 related keywords with usage recommendations.

## 5. Content Structure
Recommended H1, H2, H3 hierarchy with descriptions.

## 6. Competitor Analysis
Analysis of competing content, their strengths and gaps to exploit.

## 7. Unique Angle
Differentiating perspective or hook that sets this content apart.

## 8. Key Points to Cover
Bullet list of must-include topics and subtopics.

## 9. Internal Linking Opportunities
Suggested internal link anchors and target pages.

## 10. CTA Strategy
Primary and secondary calls-to-action placement and copy.

## 11. Meta & Technical SEO
Title tag, meta description, URL slug, schema markup recommendations.`;

	$: currentLangVal = $currentLang;

	function parseSections(md) {
		const parts = md.split(/(?=^## )/gm).filter(s => s.trim());
		return parts.map(p => {
			const lines = p.split('\n');
			const heading = lines[0].replace(/^## /, '').trim();
			const body = lines.slice(1).join('\n').trim();
			return { heading, body, open: true };
		});
	}

	function toggleSection(idx) {
		sections = sections.map((s, i) => i === idx ? { ...s, open: !s.open } : s);
	}

	async function generate() {
		if (!keyword.trim() || loading) return;
		if (!getActiveProvider()) { notify($t('mira.noApiKey'), 'error'); return; }
		loading = true;
		result = '';
		sections = [];

		const langSuffix = LANG_INSTRUCTIONS[outputLang] || LANG_INSTRUCTIONS.en;
		const wordNote = `Target word count: approximately ${wordTarget} words.`;
		const compNote = competitors.trim() ? `\nCompetitor URLs to analyze:\n${competitors}` : '';

		const userMsg = `Primary Keyword: ${keyword}
Secondary Keywords: ${secondaryKeywords || 'auto-suggest'}
Content Type: ${contentType}
Target Audience: ${audience || 'general'}
${wordNote}${compNote}`;

		await streamAI({
			system: BRIEF_SYSTEM + '\n\n' + langSuffix,
			messages: [{ role: 'user', content: userMsg }],
			action: 'brief_gen',
			onChunk: (_, full) => { result = full; sections = parseSections(full); },
			onDone: (full) => {
				result = full;
				sections = parseSections(full);
				loading = false;
			},
			onError: (e) => { result = `Error: ${e}`; loading = false; }
		});

		if (loading) loading = false;
		history.add({ keyword, contentType, audience, outputLang, wordTarget, result });
	}

	function clearAll() {
		keyword = ''; secondaryKeywords = ''; audience = ''; competitors = '';
		result = ''; sections = [];
	}

	function handleHistorySelect(e) {
		const item = e.detail;
		result = item.result || '';
		sections = parseSections(result);
		showHistory = false;
	}

	const historyRenderer = (item) => ({
		icon: '🔍', title: item.keyword || 'Brief', subtitle: item.contentType || ''
	});
</script>

<AppShell
	title="Brief Gen" icon="🔍" credits={3}
	result={result}
	{history}
	onExport={() => exportTXT(result, `brief-${keyword.replace(/\s+/g, '-')}.txt`)}
	onShare={() => { const link = generateShareLink('briefgen', result); copyToClipboard(link); notify('Share link copied ✓', 'success'); }}
	onClear={clearAll}
	on:togglehistory={() => showHistory = !showHistory}
>
	<div class="bg-layout">
		<div class="bg-main">
			{#if !result}
				<!-- Input form -->
				<div class="bg-form">
					<label class="field-label">{$t('apps.briefgen.keyword')}</label>
					<input class="bg-input" type="text" bind:value={keyword} placeholder="e.g. best project management tools" />

					<label class="field-label">{$t('apps.briefgen.secondaryKw')}</label>
					<input class="bg-input" type="text" bind:value={secondaryKeywords} placeholder="e.g. agile tools, team collaboration, kanban" />

					<label class="field-label">{$t('apps.briefgen.contentType')}</label>
					<div class="type-pills">
						{#each CONTENT_TYPES as ct}
							<button class="pill" class:active={contentType === ct} on:click={() => contentType = ct}>{ct}</button>
						{/each}
					</div>

					<label class="field-label">{$t('apps.briefgen.audience')}</label>
					<input class="bg-input" type="text" bind:value={audience} placeholder="e.g. SaaS founders, 25-45, tech-savvy" />

					<label class="field-label">{$t('apps.briefgen.competitors')}</label>
					<textarea class="bg-textarea" rows="3" bind:value={competitors} placeholder="https://competitor1.com/article&#10;https://competitor2.com/post"></textarea>

					<div class="form-row">
						<div class="form-col">
							<label class="field-label">{$t('apps.briefgen.language')}</label>
							<div class="lang-pills">
								{#each ['en', 'es', 'de', 'fr', 'zh'] as lang}
									<button class="pill sm" class:active={outputLang === lang} on:click={() => outputLang = lang}>{lang.toUpperCase()}</button>
								{/each}
							</div>
						</div>
						<div class="form-col">
							<label class="field-label">{$t('apps.briefgen.wordTarget')}</label>
							<div class="lang-pills">
								{#each WORD_TARGETS as wt}
									<button class="pill sm" class:active={wordTarget === wt} on:click={() => wordTarget = wt}>{wt}</button>
								{/each}
							</div>
						</div>
					</div>

					<button class="action-btn" on:click={generate} disabled={!keyword.trim() || loading}>
						{#if loading}⟳ Generating...{:else}🔍 {$t('apps.briefgen.generateBtn')}{/if}
					</button>
				</div>
			{:else}
				<!-- Result view -->
				<div class="bg-result">
					<div class="result-toolbar">
						<button class="sm-btn" on:click={() => { result = ''; sections = []; }}>← New Brief</button>
						<div class="result-actions">
							<button class="sm-btn" on:click={() => copyToClipboard(result).then(() => notify('Copied ✓', 'success'))}>Copy</button>
							<button class="sm-btn" on:click={() => exportPDF()}>PDF</button>
							<button class="sm-btn" on:click={() => exportTXT(result, `brief-${keyword.replace(/\s+/g, '-')}.txt`)}>TXT</button>
						</div>
					</div>

					<div class="sections-list">
						{#each sections as sec, i}
							<div class="brief-section">
								<button class="section-heading" on:click={() => toggleSection(i)}>
									<span class="chevron" class:open={sec.open}>▸</span>
									{sec.heading}
								</button>
								{#if sec.open}
									<pre class="section-body">{sec.body}</pre>
								{/if}
							</div>
						{/each}
						{#if loading}
							<div class="streaming-indicator">⟳ Streaming...</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		{#if showHistory}
			<HistorySidebar {history} renderItem={historyRenderer} on:select={handleHistorySelect} />
		{/if}
	</div>
</AppShell>

<style>
	.bg-layout { display: flex; height: 100%; }
	.bg-main { flex: 1; overflow: auto; }

	.bg-form { padding: 16px; display: flex; flex-direction: column; gap: 10px; max-width: 560px; margin: 0 auto; }
	.field-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
	.bg-input {
		width: 100%; padding: 8px 12px; background: var(--bg-elevated); border: 1px solid var(--border);
		border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 12px; color: var(--text-primary); outline: none;
	}
	.bg-input:focus { border-color: var(--accent); }
	.bg-textarea {
		width: 100%; padding: 8px 12px; background: var(--bg-elevated); border: 1px solid var(--border);
		border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 12px; color: var(--text-primary); outline: none; resize: vertical;
	}
	.bg-textarea:focus { border-color: var(--accent); }

	.type-pills, .lang-pills { display: flex; gap: 4px; flex-wrap: wrap; }
	.pill { padding: 5px 12px; font-family: var(--font-mono); font-size: 11px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 12px; color: var(--text-secondary); cursor: pointer; }
	.pill.sm { padding: 3px 8px; font-size: 10px; }
	.pill.active { border-color: var(--accent); color: var(--accent); background: var(--bg-active); }

	.form-row { display: flex; gap: 16px; }
	.form-col { flex: 1; display: flex; flex-direction: column; gap: 6px; }

	.action-btn {
		padding: 10px; width: 100%; border-radius: var(--radius-sm); font-family: var(--font-mono);
		font-size: 12px; font-weight: 700; background: var(--accent); color: var(--bg-base);
		border: none; cursor: pointer; margin-top: 6px;
	}
	.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

	.bg-result { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
	.result-toolbar { display: flex; justify-content: space-between; align-items: center; }
	.result-actions { display: flex; gap: 6px; }
	.sm-btn { font-family: var(--font-mono); font-size: 10px; padding: 4px 10px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary); cursor: pointer; }
	.sm-btn:hover { border-color: var(--accent); color: var(--accent); }

	.sections-list { display: flex; flex-direction: column; gap: 2px; }
	.brief-section { border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
	.section-heading {
		width: 100%; padding: 8px 12px; display: flex; align-items: center; gap: 8px;
		background: var(--bg-elevated); border: none; font-family: var(--font-mono);
		font-size: 12px; font-weight: 600; color: var(--text-primary); cursor: pointer; text-align: left;
	}
	.section-heading:hover { color: var(--accent); }
	.chevron { font-size: 10px; transition: transform 0.15s; display: inline-block; }
	.chevron.open { transform: rotate(90deg); }
	.section-body { padding: 8px 12px 12px 28px; font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary); line-height: 1.7; white-space: pre-wrap; word-break: break-word; margin: 0; }
	.streaming-indicator { text-align: center; font-family: var(--font-mono); font-size: 11px; color: var(--accent); padding: 8px; animation: pulse 1s infinite; }
	@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>
