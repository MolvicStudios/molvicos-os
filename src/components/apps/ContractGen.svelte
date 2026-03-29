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

	export const id = 'contractgen';

	let showHistory = false;
	const history = createAppHistory('contractgen');

	let serviceType = 'Web Development';
	let projectDesc = '';
	let price = '';
	let deliverables = '';
	let deadline = '';
	let paymentTerms = '50% upfront, 50% delivery';
	let jurisdiction = 'Spain';
	let clientType = 'B2B';
	let tone = 'formal';
	let loading = false;
	let result = '';

	const SERVICE_TYPES = ['Web Development', 'Design', 'Marketing', 'Consulting', 'App Development', 'SaaS', 'Branding', 'SEO/Content', 'Video/Media'];
	const JURISDICTIONS = ['Spain', 'LATAM', 'US', 'UK', 'EU'];
	const TONES = ['formal', 'neutral', 'friendly'];
	const PAYMENT_OPTIONS = ['50% upfront, 50% delivery', '30/40/30 milestones', '100% upfront', 'Monthly retainer', 'Custom'];

	const LANG_INSTRUCTIONS = {
		en: 'Write the entire contract in English.',
		es: 'Escribe todo el contrato en español.',
		de: 'Schreibe den gesamten Vertrag auf Deutsch.',
		fr: 'Rédige tout le contrat en français.',
		zh: '用中文撰写整个合同。'
	};

	const CONTRACT_SYSTEM = `You are an expert legal document generator for freelancers and small businesses. Generate a professional service contract/agreement.

IMPORTANT: Include a disclaimer that this is a template and NOT a substitute for professional legal advice.

Structure the output in markdown:

## 1. Contract Header
Title, date, parties involved (placeholders: [PROVIDER NAME], [CLIENT NAME]).

## 2. Scope of Work
Detailed description of services, deliverables, and exclusions based on the project description.

## 3. Timeline & Milestones
Project phases with dates/deadlines. Include revision rounds (suggest 2).

## 4. Pricing & Payment
Total price, payment schedule, accepted methods, late payment penalties (suggest 1.5% monthly).

## 5. Intellectual Property
IP transfer terms (typically: full transfer upon final payment). Pre-existing IP exceptions.

## 6. Confidentiality
Non-disclosure clauses for both parties.

## 7. Revisions & Changes
Number of included revisions, process for change requests, additional costs for out-of-scope work.

## 8. Termination
Conditions for termination by either party, notice period, payment for work completed.

## 9. Liability & Warranties
Limitation of liability, warranty period (suggest 30 days post-delivery).

## 10. Signatures
Signature blocks for both parties with date fields.

Adapt clauses to the specified jurisdiction's common practices. Adjust tone as specified.`;

	async function generate() {
		if (!projectDesc.trim() || loading) return;
		if (!getActiveProvider()) { notify($t('mira.noApiKey'), 'error'); return; }
		loading = true;
		result = '';

		const langSuffix = LANG_INSTRUCTIONS[$currentLang] || LANG_INSTRUCTIONS.en;

		const userMsg = `Service Type: ${serviceType}
Project Description: ${projectDesc}
Price: ${price || 'To be determined based on scope'}
Key Deliverables: ${deliverables || 'As described above'}
Deadline: ${deadline || 'To be agreed'}
Payment Terms: ${paymentTerms}
Jurisdiction: ${jurisdiction}
Client Type: ${clientType}
Tone: ${tone}`;

		await streamAI({
			system: CONTRACT_SYSTEM + '\n\n' + langSuffix,
			messages: [{ role: 'user', content: userMsg }],
			action: 'contractgen',
			onChunk: (_, full) => { result = full; },
			onDone: (full) => { result = full; loading = false; },
			onError: (e) => { result = `Error: ${e}`; loading = false; }
		});

		if (loading) loading = false;
		history.add({ serviceType, projectDesc, price, jurisdiction, tone, result });
	}

	function clearAll() {
		projectDesc = ''; price = ''; deliverables = ''; deadline = '';
		result = '';
	}

	function handleHistorySelect(e) {
		const item = e.detail;
		result = item.result || '';
		showHistory = false;
	}

	const historyRenderer = (item) => ({
		icon: '📑', title: item.serviceType || 'Contract', subtitle: item.jurisdiction || ''
	});

	$: resultHtml = result
		.replace(/^### (.+)$/gm, '<h4 class="contract-h4">$1</h4>')
		.replace(/^## (.+)$/gm, '<h3 class="contract-h3">$1</h3>')
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replace(/\n\n/g, '<br/><br/>')
		.replace(/\n- /g, '<br/>• ');
</script>

<AppShell
	title="ContractGen" icon="📑" credits={3}
	result={result}
	{history}
	onExport={() => exportTXT(result, `contract-${serviceType.replace(/\s+/g, '-')}.txt`)}
	onShare={() => { copyToClipboard(result); notify('Contract copied ✓', 'success'); }}
	onClear={clearAll}
	on:togglehistory={() => showHistory = !showHistory}
>
	<div class="cg-layout">
		<div class="cg-main">
			{#if !result}
				<div class="cg-form">
					<span class="field-label">{$t('apps.contractgen.serviceType')}</span>
					<div class="type-pills">
						{#each SERVICE_TYPES as st}
							<button class="pill" class:active={serviceType === st} on:click={() => serviceType = st}>{st}</button>
						{/each}
					</div>

					<label class="field-label" for="cg-desc">{$t('apps.contractgen.projectDesc')}</label>
					<textarea id="cg-desc" class="cg-textarea" rows="3" bind:value={projectDesc} placeholder={$t('apps.contractgen.projectDescPh')}></textarea>

					<div class="form-row">
						<div class="form-col">
							<label class="field-label" for="cg-price">{$t('apps.contractgen.price')}</label>
							<input id="cg-price" class="cg-input" type="text" bind:value={price} placeholder="e.g. 3,500 EUR" />
						</div>
						<div class="form-col">
							<label class="field-label" for="cg-deadline">{$t('apps.contractgen.deadline')}</label>
							<input id="cg-deadline" class="cg-input" type="text" bind:value={deadline} placeholder="e.g. April 30, 2026" />
						</div>
					</div>

					<label class="field-label" for="cg-deliverables">{$t('apps.contractgen.deliverables')}</label>
					<textarea id="cg-deliverables" class="cg-textarea" rows="2" bind:value={deliverables} placeholder={$t('apps.contractgen.deliverablesPh')}></textarea>

					<div class="form-row">
						<div class="form-col">
							<span class="field-label">{$t('apps.contractgen.payment')}</span>
							<div class="lang-pills">
								{#each PAYMENT_OPTIONS as po}
									<button class="pill sm" class:active={paymentTerms === po} on:click={() => paymentTerms = po}>{po}</button>
								{/each}
							</div>
						</div>
					</div>

					<div class="form-row">
						<div class="form-col">
							<span class="field-label">{$t('apps.contractgen.jurisdiction')}</span>
							<div class="lang-pills">
								{#each JURISDICTIONS as j}
									<button class="pill sm" class:active={jurisdiction === j} on:click={() => jurisdiction = j}>{j}</button>
								{/each}
							</div>
						</div>
						<div class="form-col">
							<span class="field-label">{$t('apps.contractgen.tone')}</span>
							<div class="lang-pills">
								{#each TONES as tn}
									<button class="pill sm" class:active={tone === tn} on:click={() => tone = tn}>{tn}</button>
								{/each}
							</div>
						</div>
					</div>

					<button class="action-btn" on:click={generate} disabled={!projectDesc.trim() || loading}>
						{#if loading}⟳ {$t('apps.contractgen.generating')}...{:else}📑 {$t('apps.contractgen.generateBtn')}{/if}
					</button>

					<p class="disclaimer">⚠️ {$t('apps.contractgen.disclaimer')}</p>
				</div>
			{:else}
				<div class="cg-result">
					<div class="result-toolbar">
						<button class="sm-btn" on:click={() => { result = ''; }}>← {$t('apps.contractgen.newContract')}</button>
						<div class="result-actions">
							<button class="sm-btn" on:click={() => copyToClipboard(result).then(() => notify('Copied ✓', 'success'))}>Copy</button>
							<button class="sm-btn" on:click={() => exportTXT(result, `contract-${serviceType.replace(/\s+/g, '-')}.txt`)}>TXT</button>
						</div>
					</div>
					<div class="contract-body">{@html resultHtml}</div>
					{#if loading}
						<div class="streaming-indicator">⟳ Streaming...</div>
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
	.cg-layout { display: flex; height: 100%; }
	.cg-main { flex: 1; overflow: auto; }

	.cg-form { padding: 16px; display: flex; flex-direction: column; gap: 10px; max-width: 600px; margin: 0 auto; }
	.field-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
	.cg-input {
		width: 100%; padding: 8px 12px; background: var(--bg-elevated); border: 1px solid var(--border);
		border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 12px; color: var(--text-primary); outline: none;
	}
	.cg-input:focus { border-color: var(--accent); }
	.cg-textarea {
		width: 100%; padding: 8px 12px; background: var(--bg-elevated); border: 1px solid var(--border);
		border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 12px; color: var(--text-primary); outline: none; resize: vertical;
	}
	.cg-textarea:focus { border-color: var(--accent); }

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

	.disclaimer { font-size: 10px; color: var(--text-muted); text-align: center; margin-top: 4px; }

	.cg-result { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
	.result-toolbar { display: flex; justify-content: space-between; align-items: center; }
	.result-actions { display: flex; gap: 6px; }
	.sm-btn { font-family: var(--font-mono); font-size: 10px; padding: 4px 10px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary); cursor: pointer; }
	.sm-btn:hover { border-color: var(--accent); color: var(--accent); }

	.contract-body {
		font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary); line-height: 1.8;
		padding: 12px; background: var(--bg-elevated); border-radius: var(--radius-sm); border: 1px solid var(--border);
	}
	.contract-body :global(.contract-h3) { font-size: 13px; font-weight: 700; color: var(--accent); margin: 16px 0 8px; }
	.contract-body :global(.contract-h4) { font-size: 12px; font-weight: 600; color: var(--text-primary); margin: 12px 0 4px; }

	.streaming-indicator { text-align: center; font-family: var(--font-mono); font-size: 11px; color: var(--accent); padding: 8px; animation: pulse 1s infinite; }
	@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>
