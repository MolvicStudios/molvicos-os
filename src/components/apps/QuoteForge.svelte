<script>
	import { t } from '$lib/i18n/index.js';
	import { currentLang } from '$lib/i18n/index.js';
	import { streamAI } from '$lib/ai/stream.js';
	import { getActiveProvider } from '$lib/providers/active.js';
	import { createAppHistory } from '$lib/stores/history.js';
	import { notify } from '$lib/stores/os.js';
	import { copyToClipboard, exportTXT } from '$lib/utils/export.js';
	import AppShell from './shared/AppShell.svelte';
	import HistorySidebar from './shared/HistorySidebar.svelte';

	export const id = 'quoteforge';

	let showHistory = false;
	const history = createAppHistory('quoteforge');

	let projectType = 'Web Development';
	let projectDesc = '';
	let complexity = 50;
	let currency = 'EUR';
	let region = 'Spain';
	let clientType = 'B2B';
	let timeline = '2-4 weeks';
	let loading = false;
	let result = '';
	let sections = [];

	const PROJECT_TYPES = ['Web Development', 'Design', 'Marketing', 'Consulting', 'App Development', 'E-commerce', 'SaaS', 'Branding', 'SEO/Content'];
	const CURRENCIES = ['EUR', 'USD', 'GBP', 'MXN'];
	const REGIONS = ['Spain', 'LATAM', 'US', 'UK', 'EU', 'Global'];
	const TIMELINES = ['1 week', '2-4 weeks', '1-2 months', '3-6 months', '6+ months'];

	const LANG_INSTRUCTIONS = {
		en: 'Write the entire quote in English. Use English currency formatting.',
		es: 'Escribe todo el presupuesto en español.',
		de: 'Schreibe das gesamte Angebot auf Deutsch.',
		fr: 'Rédige tout le devis en français.',
		zh: '用中文撰写整个报价单。'
	};

	const QUOTE_SYSTEM = `You are an expert freelance business consultant and pricing strategist. Generate a professional, detailed project quote/estimate based on the inputs provided.

Structure the output in markdown with these sections:

## 1. Project Summary
Brief overview of the project scope and deliverables.

## 2. Phase Breakdown
Break down the project into phases (Discovery, Design, Development, Testing, Delivery). For each phase include:
- Phase name and description
- Estimated hours
- Price for this phase

## 3. Pricing
- Subtotal (sum of all phases)
- Market range (min-max for this type of project in the specified region)
- Recommended price with justification
- Hourly rate implied

## 4. Timeline
Visual timeline of phases with estimated weeks/days per phase.

## 5. Payment Terms
Suggested payment schedule (e.g., 30% upfront, 40% milestone, 30% delivery).
Include suggested revision rounds and out-of-scope clauses.

## 6. Market Context
Brief note on market rates for this type of project in the region, positioning the quote within market expectations.

Be specific with numbers. Use the complexity level (0-100) to adjust pricing: 0=trivial, 50=standard, 100=enterprise-grade.
Format all prices in the specified currency.`;

	$: currentLangVal = $currentLang;
	$: complexityLabel = complexity < 30 ? 'Simple' : complexity < 70 ? 'Standard' : 'Complex';

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
		if (!projectDesc.trim() || loading) return;
		if (!getActiveProvider()) { notify($t('mira.noApiKey'), 'error'); return; }
		loading = true;
		result = '';
		sections = [];

		const langSuffix = LANG_INSTRUCTIONS[$currentLang] || LANG_INSTRUCTIONS.en;

		const userMsg = `Project Type: ${projectType}
Description: ${projectDesc}
Complexity: ${complexity}/100 (${complexityLabel})
Client Type: ${clientType}
Currency: ${currency}
Region: ${region}
Estimated Timeline: ${timeline}`;

		await streamAI({
			system: QUOTE_SYSTEM + '\n\n' + langSuffix,
			messages: [{ role: 'user', content: userMsg }],
			action: 'quoteforge',
			onChunk: (_, full) => { result = full; sections = parseSections(full); },
			onDone: (full) => {
				result = full;
				sections = parseSections(full);
				loading = false;
			},
			onError: (e) => { result = `Error: ${e}`; loading = false; }
		});

		if (loading) loading = false;
		history.add({ projectType, projectDesc, complexity, currency, region, timeline, clientType, result });
	}

	function clearAll() {
		projectDesc = ''; complexity = 50;
		result = ''; sections = [];
	}

	function handleHistorySelect(e) {
		const item = e.detail;
		result = item.result || '';
		sections = parseSections(result);
		showHistory = false;
	}

	const historyRenderer = (item) => ({
		icon: '💰', title: item.projectType || 'Quote', subtitle: item.currency || ''
	});
</script>

<AppShell
	title="QuoteForge" icon="💰" credits={3}
	result={result}
	{history}
	onExport={() => exportTXT(result, `quote-${projectType.replace(/\s+/g, '-')}.txt`)}
	onShare={() => { copyToClipboard(result); notify('Quote copied ✓', 'success'); }}
	onClear={clearAll}
	on:togglehistory={() => showHistory = !showHistory}
>
	<div class="qf-layout">
		<div class="qf-main">
			{#if !result}
				<div class="qf-form">
					<span class="field-label">{$t('apps.quoteforge.projectType')}</span>
					<div class="type-pills">
						{#each PROJECT_TYPES as pt}
							<button class="pill" class:active={projectType === pt} on:click={() => projectType = pt}>{pt}</button>
						{/each}
					</div>

					<label class="field-label" for="qf-desc">{$t('apps.quoteforge.projectDesc')}</label>
					<textarea id="qf-desc" class="qf-textarea" rows="4" bind:value={projectDesc} placeholder={$t('apps.quoteforge.projectDescPh')}></textarea>

					<label class="field-label">{$t('apps.quoteforge.complexity')}: {complexity}% ({complexityLabel})</label>
					<input type="range" min="0" max="100" bind:value={complexity} class="qf-slider" />

					<div class="form-row">
						<div class="form-col">
							<span class="field-label">{$t('apps.quoteforge.currency')}</span>
							<div class="lang-pills">
								{#each CURRENCIES as c}
									<button class="pill sm" class:active={currency === c} on:click={() => currency = c}>{c}</button>
								{/each}
							</div>
						</div>
						<div class="form-col">
							<span class="field-label">{$t('apps.quoteforge.region')}</span>
							<div class="lang-pills">
								{#each REGIONS as r}
									<button class="pill sm" class:active={region === r} on:click={() => region = r}>{r}</button>
								{/each}
							</div>
						</div>
					</div>

					<div class="form-row">
						<div class="form-col">
							<span class="field-label">{$t('apps.quoteforge.clientType')}</span>
							<div class="lang-pills">
								<button class="pill sm" class:active={clientType === 'B2B'} on:click={() => clientType = 'B2B'}>B2B</button>
								<button class="pill sm" class:active={clientType === 'B2C'} on:click={() => clientType = 'B2C'}>B2C</button>
							</div>
						</div>
						<div class="form-col">
							<span class="field-label">{$t('apps.quoteforge.timeline')}</span>
							<div class="lang-pills">
								{#each TIMELINES as tl}
									<button class="pill sm" class:active={timeline === tl} on:click={() => timeline = tl}>{tl}</button>
								{/each}
							</div>
						</div>
					</div>

					<button class="action-btn" on:click={generate} disabled={!projectDesc.trim() || loading}>
						{#if loading}⟳ {$t('apps.quoteforge.generating')}...{:else}💰 {$t('apps.quoteforge.generateBtn')}{/if}
					</button>
				</div>
			{:else}
				<div class="qf-result">
					<div class="result-toolbar">
						<button class="sm-btn" on:click={() => { result = ''; sections = []; }}>← {$t('apps.quoteforge.newQuote')}</button>
						<div class="result-actions">
							<button class="sm-btn" on:click={() => copyToClipboard(result).then(() => notify('Copied ✓', 'success'))}>Copy</button>
							<button class="sm-btn" on:click={() => exportTXT(result, `quote-${projectType.replace(/\s+/g, '-')}.txt`)}>TXT</button>
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
	.qf-layout { display: flex; height: 100%; }
	.qf-main { flex: 1; overflow: auto; }

	.qf-form { padding: 16px; display: flex; flex-direction: column; gap: 10px; max-width: 600px; margin: 0 auto; }
	.field-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
	.qf-textarea {
		width: 100%; padding: 8px 12px; background: var(--bg-elevated); border: 1px solid var(--border);
		border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 12px; color: var(--text-primary); outline: none; resize: vertical;
	}
	.qf-textarea:focus { border-color: var(--accent); }
	.qf-slider { width: 100%; accent-color: var(--accent); }

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

	.qf-result { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
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
