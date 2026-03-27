<script>
	import { t } from '$lib/i18n/index.js';
	import { streamAI } from '$lib/ai/stream.js';
	import { getActiveProvider } from '$lib/providers/active.js';
	import { userProfile } from '$lib/stores/user.js';
	import { createAppHistory } from '$lib/stores/history.js';
	import { notify } from '$lib/stores/os.js';
	import { copyToClipboard, exportTXT, generateShareLink } from '$lib/utils/export.js';
	import AppShell from './shared/AppShell.svelte';
	import HistorySidebar from './shared/HistorySidebar.svelte';

	export let id = 'workflow';

	let showHistory = false;
	const history = createAppHistory('workflow');

	let description = '';
	let triggerType = 'Webhook';
	let complexity = 'Medium';
	let errorHandling = true;
	let loading = false;
	let rawResult = '';
	let jsonStr = '';
	let parsed = null;
	let validationStatus = 'none';

	const TRIGGERS = ['Webhook', 'Schedule', 'Form', 'Email', 'Manual'];
	const COMPLEXITY = ['Simple', 'Medium', 'Advanced'];

	const NODE_ICONS = {
		'n8n-nodes-base.webhook': '🌐',
		'n8n-nodes-base.scheduleTrigger': '⏰',
		'n8n-nodes-base.formTrigger': '📋',
		'n8n-nodes-base.emailTrigger': '✉️',
		'n8n-nodes-base.manualTrigger': '▶️',
		'n8n-nodes-base.httpRequest': '🔗',
		'n8n-nodes-base.if': '🔀',
		'n8n-nodes-base.set': '✏️',
		'n8n-nodes-base.code': '💻',
		'n8n-nodes-base.merge': '🔗',
		'n8n-nodes-base.noOp': '⏸️',
		'n8n-nodes-base.respondToWebhook': '↩️',
		'n8n-nodes-base.errorTrigger': '⚠️',
		'n8n-nodes-base.gmail': '📧',
		'n8n-nodes-base.slack': '💬',
		'n8n-nodes-base.googleSheets': '📊',
		'n8n-nodes-base.airtable': '🗃️',
		'n8n-nodes-base.postgres': '🐘',
		'n8n-nodes-base.mysql': '🐬',
		default: '⚙️'
	};

	const WORKFLOW_SYSTEM = `You are an expert n8n workflow architect. Generate a VALID n8n workflow JSON that can be directly imported.

RULES:
- Output ONLY valid JSON (no markdown fences, no commentary)
- Use real n8n node types (e.g. n8n-nodes-base.webhook, n8n-nodes-base.httpRequest)
- Include proper connections array linking nodes
- Each node needs: id, name, type, typeVersion, position [x,y], parameters
- Include the workflow-level fields: name, nodes, connections, settings
- Position nodes in a left-to-right flow (increment x by 250 per step)
- The trigger node must be first
${errorHandling ? '- Add error handling: include an Error Trigger node connected to error notification' : ''}

COMPLEXITY GUIDE:
- Simple: 3-5 nodes, linear flow
- Medium: 5-10 nodes, may include conditionals and merge
- Advanced: 10-20 nodes, parallel branches, error handling, multiple integrations`;

	function extractJSON(text) {
		const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
		if (fenced) return fenced[1].trim();
		const braceStart = text.indexOf('{');
		const braceEnd = text.lastIndexOf('}');
		if (braceStart !== -1 && braceEnd > braceStart) return text.slice(braceStart, braceEnd + 1);
		return text;
	}

	function validateJSON(str) {
		try {
			const obj = JSON.parse(str);
			if (!obj.nodes || !Array.isArray(obj.nodes)) return { status: 'warning', msg: 'Missing nodes array' };
			if (!obj.connections) return { status: 'warning', msg: 'Missing connections object' };
			if (obj.nodes.length === 0) return { status: 'warning', msg: 'Workflow has no nodes' };
			return { status: 'valid', msg: `Valid workflow: ${obj.nodes.length} nodes` };
		} catch (e) {
			return { status: 'error', msg: 'Invalid JSON: ' + e.message };
		}
	}

	$: if (jsonStr) {
		const v = validateJSON(jsonStr);
		validationStatus = v.status;
		try { parsed = JSON.parse(jsonStr); } catch { parsed = null; }
	}

	$: nodes = parsed?.nodes || [];
	$: connections = parsed?.connections || {};

	function getNodeIcon(type) {
		return NODE_ICONS[type] || NODE_ICONS.default;
	}

	async function generate() {
		if (!description.trim() || loading) return;
		if (!getActiveProvider()) { notify($t('mira.noApiKey'), 'error'); return; }
		loading = true;
		rawResult = '';
		jsonStr = '';
		parsed = null;
		validationStatus = 'none';

		const userMsg = `Create an n8n workflow for: ${description}
Trigger type: ${triggerType}
Complexity: ${complexity}
Error handling: ${errorHandling ? 'Yes' : 'No'}`;

		await streamAI({
			system: WORKFLOW_SYSTEM,
			messages: [{ role: 'user', content: userMsg }],
			action: 'workflow_builder',
			onChunk: (_, full) => { rawResult = full; },
			onDone: (full) => {
				rawResult = full;
				jsonStr = extractJSON(full);
				loading = false;
			},
			onError: (e) => {
				rawResult = `Error: ${e}`;
				loading = false;
			}
		});

		if (loading) loading = false;
		if (jsonStr) history.add({ description: description.slice(0, 100), triggerType, complexity, jsonStr });
	}

	function downloadJSON() {
		const blob = new Blob([jsonStr], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `workflow-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function clearAll() {
		description = ''; rawResult = ''; jsonStr = ''; parsed = null; validationStatus = 'none';
	}

	function handleHistorySelect(e) {
		const item = e.detail;
		jsonStr = item.jsonStr || '';
		rawResult = jsonStr;
		showHistory = false;
	}

	const historyRenderer = (item) => ({
		icon: '⚙️', title: item.description || 'Workflow', subtitle: item.triggerType || ''
	});

	function addLineNumbers(str) {
		return str.split('\n').map((l, i) => `${String(i + 1).padStart(3)} ${l}`).join('\n');
	}
</script>

<AppShell
	title="Workflow Builder" icon="⚙️" credits={5}
	result={jsonStr}
	{history}
	onExport={() => exportTXT(jsonStr, 'workflow.json')}
	onShare={() => { const link = generateShareLink('workflow', jsonStr); copyToClipboard(link); notify('Share link copied ✓', 'success'); }}
	onClear={clearAll}
	on:togglehistory={() => showHistory = !showHistory}
>
	<div class="wb-layout">
		<div class="wb-main">
			{#if !jsonStr && !loading}
				<!-- Input form -->
				<div class="wb-form">
					<label class="field-label">{$t('apps.workflow.descLabel')}</label>
					<textarea class="wb-textarea" rows="5" bind:value={description} placeholder={$t('apps.workflow.descPlaceholder')}></textarea>

					<label class="field-label">{$t('apps.workflow.triggerType')}</label>
					<div class="type-pills">
						{#each TRIGGERS as tr}
							<button class="pill" class:active={triggerType === tr} on:click={() => triggerType = tr}>{tr}</button>
						{/each}
					</div>

					<label class="field-label">{$t('apps.workflow.complexity')}</label>
					<div class="type-pills">
						{#each COMPLEXITY as c}
							<button class="pill" class:active={complexity === c} on:click={() => complexity = c}>{c}</button>
						{/each}
					</div>

					<label class="wb-toggle">
						<input type="checkbox" bind:checked={errorHandling} />
						<span>{$t('apps.workflow.errorHandling')}</span>
					</label>

					<button class="action-btn" on:click={generate} disabled={!description.trim() || loading}>
						⚙️ {$t('apps.workflow.generateBtn')}
					</button>
				</div>
			{:else}
				<!-- Result split view -->
				{#if validationStatus !== 'none'}
					<div class="validation-banner" class:valid={validationStatus === 'valid'} class:warning={validationStatus === 'warning'} class:error={validationStatus === 'error'}>
						{#if validationStatus === 'valid'}✅{:else if validationStatus === 'warning'}⚠️{:else}❌{/if}
						{validateJSON(jsonStr).msg}
					</div>
				{/if}

				<div class="wb-split">
					<!-- Left: JSON viewer -->
					<div class="wb-left">
						<div class="json-toolbar">
							<span class="json-label">workflow.json</span>
							<div class="json-actions">
								<button class="sm-btn" on:click={() => copyToClipboard(jsonStr).then(() => notify('Copied ✓', 'success'))}>Copy</button>
								<button class="sm-btn" on:click={downloadJSON}>Download</button>
								<button class="sm-btn" on:click={() => { jsonStr = ''; rawResult = ''; parsed = null; validationStatus = 'none'; }}>← New</button>
							</div>
						</div>
						<pre class="json-viewer">{loading ? rawResult || '⟳ Generating...' : addLineNumbers(jsonStr)}</pre>
					</div>

					<!-- Right: Visual flow -->
					<div class="wb-right">
						<div class="flow-label">Node flow</div>
						{#if nodes.length > 0}
							<div class="node-flow">
								{#each nodes as node, i}
									<div class="flow-node">
										<span class="node-icon">{getNodeIcon(node.type)}</span>
										<span class="node-name">{node.name}</span>
										<span class="node-type">{(node.type || '').replace('n8n-nodes-base.', '')}</span>
									</div>
									{#if i < nodes.length - 1}
										<div class="flow-arrow">→</div>
									{/if}
								{/each}
							</div>
						{:else if !loading}
							<div class="flow-empty">Parsing nodes...</div>
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
	.wb-layout { display: flex; height: 100%; }
	.wb-main { flex: 1; overflow: auto; display: flex; flex-direction: column; }

	.wb-form { padding: 16px; display: flex; flex-direction: column; gap: 10px; max-width: 520px; margin: 0 auto; width: 100%; }
	.field-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
	.wb-textarea {
		width: 100%; padding: 10px 12px; background: var(--bg-elevated); border: 1px solid var(--border);
		border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 12px;
		color: var(--text-primary); resize: vertical; outline: none;
	}
	.wb-textarea:focus { border-color: var(--accent); }

	.type-pills { display: flex; gap: 4px; flex-wrap: wrap; }
	.pill { padding: 5px 12px; font-family: var(--font-mono); font-size: 11px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 12px; color: var(--text-secondary); cursor: pointer; }
	.pill.active { border-color: var(--accent); color: var(--accent); background: var(--bg-active); }

	.wb-toggle { display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary); cursor: pointer; }
	.wb-toggle input { accent-color: var(--accent); }

	.action-btn {
		padding: 10px; width: 100%; border-radius: var(--radius-sm); font-family: var(--font-mono);
		font-size: 12px; font-weight: 700; background: var(--accent); color: var(--bg-base);
		border: none; cursor: pointer; margin-top: 6px;
	}
	.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

	.validation-banner {
		padding: 6px 12px; font-family: var(--font-mono); font-size: 11px; text-align: center; flex-shrink: 0;
	}
	.validation-banner.valid { background: #0a2c0a; color: #4ade80; border-bottom: 1px solid #166534; }
	.validation-banner.warning { background: #2c2a0a; color: #facc15; border-bottom: 1px solid #854d0e; }
	.validation-banner.error { background: #2c0a0a; color: #f87171; border-bottom: 1px solid #991b1b; }

	.wb-split { display: flex; flex: 1; overflow: hidden; }
	.wb-left { width: 60%; display: flex; flex-direction: column; border-right: 1px solid var(--border); }
	.wb-right { width: 40%; display: flex; flex-direction: column; overflow: auto; }

	.json-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
	.json-label { font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); }
	.json-actions { display: flex; gap: 4px; }
	.sm-btn { font-family: var(--font-mono); font-size: 10px; padding: 3px 8px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary); cursor: pointer; }
	.sm-btn:hover { border-color: var(--accent); color: var(--accent); }

	.json-viewer {
		flex: 1; overflow: auto; padding: 12px; font-family: var(--font-mono); font-size: 11px;
		color: var(--text-primary); line-height: 1.6; white-space: pre; margin: 0;
		tab-size: 2; background: var(--bg-base);
	}

	.flow-label { padding: 6px 12px; font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); text-transform: uppercase; border-bottom: 1px solid var(--border); flex-shrink: 0; }
	.node-flow { padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 0; }
	.flow-node {
		display: flex; align-items: center; gap: 8px; padding: 8px 14px;
		background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-sm);
		min-width: 160px;
	}
	.node-icon { font-size: 16px; }
	.node-name { font-family: var(--font-mono); font-size: 11px; color: var(--text-primary); font-weight: 600; }
	.node-type { font-family: var(--font-mono); font-size: 9px; color: var(--text-muted); margin-left: auto; }
	.flow-arrow { font-size: 16px; color: var(--accent); padding: 2px 0; }
	.flow-empty { padding: 20px; text-align: center; font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); }
</style>
