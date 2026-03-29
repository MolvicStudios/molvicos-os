<script>
	import { t } from '$lib/i18n/index.js';
	import { currentLang } from '$lib/i18n/index.js';
	import { streamAI } from '$lib/ai/stream.js';
	import { getActiveProvider } from '$lib/providers/active.js';
	import { createAppHistory } from '$lib/stores/history.js';
	import { notify } from '$lib/stores/os.js';
	import { copyToClipboard, exportTXT } from '$lib/utils/export.js';
	import { storage } from '$lib/storage/local.js';
	import AppShell from './shared/AppShell.svelte';
	import HistorySidebar from './shared/HistorySidebar.svelte';

	export const id = 'invoiceai';

	let showHistory = false;
	const history = createAppHistory('invoiceai');

	// Provider data (persisted)
	let providerName = storage.get('ms_invoice_provider') || '';
	let providerTaxId = storage.get('ms_invoice_taxid') || '';
	let providerAddress = storage.get('ms_invoice_address') || '';

	// Client data
	let clientName = '';
	let clientCompany = '';
	let clientAddress = '';

	// Invoice data
	let description = '';
	let currency = 'EUR';
	let taxRegime = 'Spain (IVA 21%)';
	let invoiceNumber = storage.get('ms_invoice_next_num') || '001';
	let loading = false;
	let result = '';

	const CURRENCIES = ['EUR', 'USD', 'GBP', 'MXN'];
	const TAX_REGIMES = [
		'Spain (IVA 21%)',
		'Spain Autónomo (IVA 21% - IRPF 15%)',
		'EU Intra-community (0%)',
		'US (No VAT)',
		'UK (VAT 20%)',
		'LATAM (varies)',
		'No tax'
	];

	const LANG_INSTRUCTIONS = {
		en: 'Write the entire invoice in English.',
		es: 'Escribe toda la factura en español.',
		de: 'Schreibe die gesamte Rechnung auf Deutsch.',
		fr: 'Rédige toute la facture en français.',
		zh: '用中文撰写整个发票。'
	};

	const INVOICE_SYSTEM = `You are an expert invoicing assistant for freelancers and small businesses. Generate a professional, clear invoice based on the inputs.

Structure the output in plain text format suitable for copying:

## INVOICE

**Invoice Number**: [number]
**Date**: [today's date]
**Due Date**: [30 days from today]

---

### FROM (Provider)
[Provider details]

### TO (Client)
[Client details]

---

### LINE ITEMS

| # | Description | Qty | Unit Price | Total |
|---|-------------|-----|------------|-------|
| 1 | [item]      | 1   | [price]    | [total] |

---

### TOTALS
- **Subtotal**: [amount]
- **Tax** ([tax type] [rate]%): [amount]
- **IRPF** (if applicable): -[amount]
- **TOTAL**: [final amount]

---

**Payment Terms**: [bank transfer / PayPal / etc.]
**Notes**: Thank you for your business.

Parse the description to extract individual line items with reasonable prices. Apply the correct tax calculations based on the tax regime specified.`;

	function saveProviderData() {
		storage.set('ms_invoice_provider', providerName);
		storage.set('ms_invoice_taxid', providerTaxId);
		storage.set('ms_invoice_address', providerAddress);
	}

	function incrementInvoiceNumber() {
		const num = parseInt(invoiceNumber, 10);
		const next = String(num + 1).padStart(3, '0');
		invoiceNumber = next;
		storage.set('ms_invoice_next_num', next);
	}

	async function generate() {
		if (!description.trim() || loading) return;
		if (!getActiveProvider()) { notify($t('mira.noApiKey'), 'error'); return; }
		loading = true;
		result = '';
		saveProviderData();

		const langSuffix = LANG_INSTRUCTIONS[$currentLang] || LANG_INSTRUCTIONS.en;

		const userMsg = `Invoice Number: ${invoiceNumber}

Provider:
- Name: ${providerName || '[Your Name / Company]'}
- Tax ID: ${providerTaxId || '[Your Tax ID]'}
- Address: ${providerAddress || '[Your Address]'}

Client:
- Name: ${clientName || '[Client Name]'}
- Company: ${clientCompany || ''}
- Address: ${clientAddress || '[Client Address]'}

Services/Items Description:
${description}

Currency: ${currency}
Tax Regime: ${taxRegime}`;

		await streamAI({
			system: INVOICE_SYSTEM + '\n\n' + langSuffix,
			messages: [{ role: 'user', content: userMsg }],
			action: 'invoiceai',
			onChunk: (_, full) => { result = full; },
			onDone: (full) => { result = full; loading = false; },
			onError: (e) => { result = `Error: ${e}`; loading = false; }
		});

		if (loading) loading = false;
		history.add({ invoiceNumber, clientName, clientCompany, description, currency, taxRegime, result, ts: Date.now() });
		incrementInvoiceNumber();
	}

	function clearAll() {
		clientName = ''; clientCompany = ''; clientAddress = '';
		description = ''; result = '';
	}

	function handleHistorySelect(e) {
		const item = e.detail;
		result = item.result || '';
		showHistory = false;
	}

	const historyRenderer = (item) => ({
		icon: '🧾', title: `#${item.invoiceNumber} — ${item.clientName || 'Invoice'}`, subtitle: item.currency || ''
	});

	$: resultHtml = result
		.replace(/^### (.+)$/gm, '<h4 class="inv-h4">$1</h4>')
		.replace(/^## (.+)$/gm, '<h3 class="inv-h3">$1</h3>')
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replace(/\|(.+)\|/g, (m) => `<span class="inv-table-row">${m}</span>`)
		.replace(/---/g, '<hr class="inv-hr"/>')
		.replace(/\n\n/g, '<br/><br/>')
		.replace(/\n- /g, '<br/>• ');
</script>

<AppShell
	title="InvoiceAI" icon="🧾" credits={2}
	result={result}
	{history}
	onExport={() => exportTXT(result, `invoice-${invoiceNumber}.txt`)}
	onShare={() => { copyToClipboard(result); notify('Invoice copied ✓', 'success'); }}
	onClear={clearAll}
	on:togglehistory={() => showHistory = !showHistory}
>
	<div class="inv-layout">
		<div class="inv-main">
			{#if !result}
				<div class="inv-form">
					<!-- Provider section -->
					<div class="section-header">📋 {$t('apps.invoiceai.providerInfo')}</div>
					<div class="form-row">
						<div class="form-col">
							<label class="field-label" for="inv-provider">{$t('apps.invoiceai.providerName')}</label>
							<input id="inv-provider" class="inv-input" type="text" bind:value={providerName} placeholder="Your name / company" />
						</div>
						<div class="form-col">
							<label class="field-label" for="inv-taxid">{$t('apps.invoiceai.taxId')}</label>
							<input id="inv-taxid" class="inv-input" type="text" bind:value={providerTaxId} placeholder="NIF/CIF/EIN" />
						</div>
					</div>
					<label class="field-label" for="inv-addr">{$t('apps.invoiceai.address')}</label>
					<input id="inv-addr" class="inv-input" type="text" bind:value={providerAddress} placeholder="Street, City, ZIP" />

					<!-- Client section -->
					<div class="section-header">👤 {$t('apps.invoiceai.clientInfo')}</div>
					<div class="form-row">
						<div class="form-col">
							<label class="field-label" for="inv-client">{$t('apps.invoiceai.clientName')}</label>
							<input id="inv-client" class="inv-input" type="text" bind:value={clientName} placeholder="Client name" />
						</div>
						<div class="form-col">
							<label class="field-label" for="inv-company">{$t('apps.invoiceai.clientCompany')}</label>
							<input id="inv-company" class="inv-input" type="text" bind:value={clientCompany} placeholder="Company (optional)" />
						</div>
					</div>
					<label class="field-label" for="inv-caddr">{$t('apps.invoiceai.clientAddress')}</label>
					<input id="inv-caddr" class="inv-input" type="text" bind:value={clientAddress} placeholder="Client address" />

					<!-- Invoice details -->
					<div class="section-header">🧾 {$t('apps.invoiceai.invoiceDetails')}</div>
					<div class="form-row">
						<div class="form-col">
							<label class="field-label" for="inv-num">{$t('apps.invoiceai.invoiceNum')}</label>
							<input id="inv-num" class="inv-input" type="text" bind:value={invoiceNumber} />
						</div>
						<div class="form-col">
							<span class="field-label">{$t('apps.invoiceai.currency')}</span>
							<div class="lang-pills">
								{#each CURRENCIES as c}
									<button class="pill sm" class:active={currency === c} on:click={() => currency = c}>{c}</button>
								{/each}
							</div>
						</div>
					</div>

					<span class="field-label">{$t('apps.invoiceai.taxRegime')}</span>
					<div class="type-pills">
						{#each TAX_REGIMES as tr}
							<button class="pill" class:active={taxRegime === tr} on:click={() => taxRegime = tr}>{tr}</button>
						{/each}
					</div>

					<label class="field-label" for="inv-desc">{$t('apps.invoiceai.services')}</label>
					<textarea id="inv-desc" class="inv-textarea" rows="4" bind:value={description} placeholder={$t('apps.invoiceai.servicesPh')}></textarea>

					<button class="action-btn" on:click={generate} disabled={!description.trim() || loading}>
						{#if loading}⟳ {$t('apps.invoiceai.generating')}...{:else}🧾 {$t('apps.invoiceai.generateBtn')}{/if}
					</button>
				</div>
			{:else}
				<div class="inv-result">
					<div class="result-toolbar">
						<button class="sm-btn" on:click={() => { result = ''; }}>← {$t('apps.invoiceai.newInvoice')}</button>
						<div class="result-actions">
							<button class="sm-btn" on:click={() => copyToClipboard(result).then(() => notify('Copied ✓', 'success'))}>Copy</button>
							<button class="sm-btn" on:click={() => exportTXT(result, `invoice-${invoiceNumber}.txt`)}>TXT</button>
						</div>
					</div>
					<div class="invoice-body">{@html resultHtml}</div>
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
	.inv-layout { display: flex; height: 100%; }
	.inv-main { flex: 1; overflow: auto; }

	.inv-form { padding: 16px; display: flex; flex-direction: column; gap: 8px; max-width: 600px; margin: 0 auto; }
	.section-header { font-size: 12px; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono); margin-top: 8px; padding-bottom: 4px; border-bottom: 1px solid var(--border); }
	.field-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
	.inv-input {
		width: 100%; padding: 8px 12px; background: var(--bg-elevated); border: 1px solid var(--border);
		border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 12px; color: var(--text-primary); outline: none;
	}
	.inv-input:focus { border-color: var(--accent); }
	.inv-textarea {
		width: 100%; padding: 8px 12px; background: var(--bg-elevated); border: 1px solid var(--border);
		border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 12px; color: var(--text-primary); outline: none; resize: vertical;
	}
	.inv-textarea:focus { border-color: var(--accent); }

	.type-pills, .lang-pills { display: flex; gap: 4px; flex-wrap: wrap; }
	.pill { padding: 5px 12px; font-family: var(--font-mono); font-size: 11px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 12px; color: var(--text-secondary); cursor: pointer; }
	.pill.sm { padding: 3px 8px; font-size: 10px; }
	.pill.active { border-color: var(--accent); color: var(--accent); background: var(--bg-active); }

	.form-row { display: flex; gap: 12px; }
	.form-col { flex: 1; display: flex; flex-direction: column; gap: 4px; }

	.action-btn {
		padding: 10px; width: 100%; border-radius: var(--radius-sm); font-family: var(--font-mono);
		font-size: 12px; font-weight: 700; background: var(--accent); color: var(--bg-base);
		border: none; cursor: pointer; margin-top: 6px;
	}
	.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

	.inv-result { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
	.result-toolbar { display: flex; justify-content: space-between; align-items: center; }
	.result-actions { display: flex; gap: 6px; }
	.sm-btn { font-family: var(--font-mono); font-size: 10px; padding: 4px 10px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary); cursor: pointer; }
	.sm-btn:hover { border-color: var(--accent); color: var(--accent); }

	.invoice-body {
		font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary); line-height: 1.8;
		padding: 16px; background: var(--bg-elevated); border-radius: var(--radius-sm); border: 1px solid var(--border);
	}
	.invoice-body :global(.inv-h3) { font-size: 14px; font-weight: 700; color: var(--accent); margin: 16px 0 8px; }
	.invoice-body :global(.inv-h4) { font-size: 12px; font-weight: 600; color: var(--text-primary); margin: 12px 0 4px; }
	.invoice-body :global(.inv-hr) { border: none; border-top: 1px solid var(--border); margin: 12px 0; }
	.invoice-body :global(.inv-table-row) { font-size: 10px; }

	.streaming-indicator { text-align: center; font-family: var(--font-mono); font-size: 11px; color: var(--accent); padding: 8px; animation: pulse 1s infinite; }
	@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>
