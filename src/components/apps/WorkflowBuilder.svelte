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

	export const id = 'workflow';

	let showHistory = false;
	const history = createAppHistory('workflow');

	// --- Shared state ---
	let activeTab = 'n8n';
	let description = '';
	let loading = false;
	let rawResult = '';
	let result = '';

	// --- n8n specific ---
	let triggerType = 'Webhook';
	let complexity = 'Medium';
	let errorHandling = true;
	let jsonStr = '';
	let parsed = null;
	let validationStatus = 'none';

	const TRIGGERS = ['Webhook', 'Schedule', 'Form', 'Email', 'Manual'];
	const COMPLEXITY = ['Simple', 'Medium', 'Advanced'];

	// --- Make specific ---
	let makeModules = 'HTTP';
	const MAKE_MODULES = ['HTTP', 'Google Sheets', 'Slack', 'Email', 'Airtable', 'Webhooks', 'Router'];

	// --- Resource types (from original Prospectly) ---
	let resourceType = 'automation';
	let resourceLevel = 'basic';

	const RESOURCE_TYPES = [
		{ id: 'automation', emoji: '🤖', label: 'Automation Spec' },
		{ id: 'script_python', emoji: '🐍', label: 'Python Script' },
		{ id: 'script_js', emoji: '📦', label: 'JS Script' },
		{ id: 'prompt', emoji: '🔧', label: 'AI Prompt' },
		{ id: 'guide', emoji: '📖', label: 'Guide' },
		{ id: 'template', emoji: '📋', label: 'Template' }
	];

	const TABS = [
		{ id: 'n8n', emoji: '⚙️', label: 'n8n' },
		{ id: 'make', emoji: '🔗', label: 'Make' },
		{ id: 'resources', emoji: '📦', label: 'Resources' }
	];

	// --- Node icons for n8n visual flow ---
	const NODE_ICONS = {
		'n8n-nodes-base.webhook': '🌐', 'n8n-nodes-base.scheduleTrigger': '⏰',
		'n8n-nodes-base.formTrigger': '📋', 'n8n-nodes-base.emailTrigger': '✉️',
		'n8n-nodes-base.manualTrigger': '▶️', 'n8n-nodes-base.httpRequest': '🔗',
		'n8n-nodes-base.if': '🔀', 'n8n-nodes-base.set': '✏️',
		'n8n-nodes-base.code': '💻', 'n8n-nodes-base.merge': '🔗',
		'n8n-nodes-base.noOp': '⏸️', 'n8n-nodes-base.respondToWebhook': '↩️',
		'n8n-nodes-base.errorTrigger': '⚠️', 'n8n-nodes-base.gmail': '📧',
		'n8n-nodes-base.slack': '💬', 'n8n-nodes-base.googleSheets': '📊',
		'n8n-nodes-base.airtable': '🗃️', 'n8n-nodes-base.postgres': '🐘',
		default: '⚙️'
	};

	// --- System prompts ---
	const SYSTEMS = {
		n8n: `You are an expert n8n workflow architect. Generate a VALID n8n workflow JSON that can be directly imported.
RULES:
- Output ONLY valid JSON (no markdown fences, no commentary)
- Use real n8n node types (e.g. n8n-nodes-base.webhook, n8n-nodes-base.httpRequest)
- Include proper connections array linking nodes
- Each node needs: id, name, type, typeVersion, position [x,y], parameters
- Include workflow-level fields: name, nodes, connections, settings
- Position nodes left-to-right (increment x by 250 per step)
- Trigger node must be first`,

		make: `You are an expert Make (formerly Integromat) automation architect.
Generate a detailed Make scenario specification for the described use case.
Include:
- SCENARIO NAME and description
- MODULES: numbered list of each module with its app, action, and configuration
- DATA MAPPING: how data flows between modules
- ERROR HANDLING: error routes and fallbacks
- FILTERS: any conditional filters between modules
- SCHEDULING: recommended schedule settings
Format as structured text with clear sections.`,

		automation: `You are an expert in AI-powered business process automation.
Generate a complete automation specification including: flow description, recommended tools, implementation steps, code or configuration needed.`,

		script_python: `You are a Python automation expert. Generate a complete, functional, well-commented Python script.
Include: necessary imports, main function, error handling, usage example, and requirements.txt if needed. Ready to run.`,

		script_js: `You are a JavaScript/Node.js automation expert. Generate a complete, functional, well-commented script.
Include: imports/requires, main function, error handling, usage example, and package.json deps if needed. Ready to run.`,

		prompt: `You are a prompt engineering expert. Generate a professional, complete, ready-to-use AI prompt.
Include clear instructions, usage examples, and variables marked with [VARIABLE].`,

		guide: `You are an AI and automation expert. Generate a comprehensive practical guide.
Include: introduction, key concepts, step-by-step implementation, real examples, common mistakes, and additional resources. Use Markdown.`,

		template: `You are a productivity and AI automation expert. Generate a complete, ready-to-use template.
Include practical structure with variables marked [VARIABLE] and usage instructions.`
	};

	// --- n8n JSON helpers ---
	function extractJSON(text) {
		const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
		if (fenced) {
			const candidate = fenced[1].trim();
			try {
				const parsed = JSON.parse(candidate);
				if (parsed.nodes && Array.isArray(parsed.nodes)) return candidate;
			} catch {}
		}
		// Fallback: find outermost braces and validate structure
		const braceStart = text.indexOf('{');
		const braceEnd = text.lastIndexOf('}');
		if (braceStart !== -1 && braceEnd > braceStart) {
			const candidate = text.slice(braceStart, braceEnd + 1);
			try {
				const parsed = JSON.parse(candidate);
				if (parsed.nodes && Array.isArray(parsed.nodes)) return candidate;
			} catch {}
		}
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

	function getNodeIcon(type) { return NODE_ICONS[type] || NODE_ICONS.default; }

	// --- Generation ---
	async function generate() {
		if (!description.trim() || loading) return;
		if (!getActiveProvider()) { notify($t('mira.noApiKey'), 'error'); return; }
		loading = true;
		rawResult = '';
		result = '';
		jsonStr = '';
		parsed = null;
		validationStatus = 'none';

		let system, userMsg;

		if (activeTab === 'n8n') {
			system = SYSTEMS.n8n + (errorHandling ? '\n- Add error handling: include an Error Trigger node connected to error notification' : '');
			userMsg = `Create an n8n workflow for: ${description}\nTrigger type: ${triggerType}\nComplexity: ${complexity}\nError handling: ${errorHandling ? 'Yes' : 'No'}`;
		} else if (activeTab === 'make') {
			system = SYSTEMS.make;
			userMsg = `Create a Make scenario for: ${description}\nPrimary module: ${makeModules}\nInclude error handling and data mapping.`;
		} else {
			system = SYSTEMS[resourceType] || SYSTEMS.automation;
			const levelDesc = resourceLevel === 'advanced' ? 'Advanced — production-ready with error handling, edge cases, and best practices' : 'Basic — functional and easy to understand';
			userMsg = `Generate a ${resourceType.replace('_', ' ')} for: ${description}\nLevel: ${levelDesc}`;
		}

		await streamAI({
			system,
			messages: [{ role: 'user', content: userMsg }],
			action: 'workflow_builder',
			onChunk: (_, full) => { rawResult = full; },
			onDone: (full) => {
				rawResult = full;
				if (activeTab === 'n8n') {
					jsonStr = extractJSON(full);
					result = jsonStr;
				} else {
					result = full;
				}
				loading = false;
			},
			onError: (e) => {
				rawResult = `Error: ${e}`;
				loading = false;
			}
		});

		if (loading) loading = false;
		const historyEntry = { tab: activeTab, description: description.slice(0, 100) };
		if (activeTab === 'n8n') historyEntry.jsonStr = jsonStr;
		else historyEntry.result = result;
		if (result || jsonStr) history.add(historyEntry);
	}

	function downloadFile() {
		const isJSON = activeTab === 'n8n' && jsonStr;
		const content = isJSON ? jsonStr : result;
		const ext = isJSON ? 'json' : 'txt';
		const blob = new Blob([content], { type: isJSON ? 'application/json' : 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${activeTab}-${Date.now()}.${ext}`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function clearAll() {
		description = ''; rawResult = ''; result = ''; jsonStr = ''; parsed = null; validationStatus = 'none';
	}

	function switchTab(tab) {
		if (tab === activeTab) return;
		clearAll();
		activeTab = tab;
	}

	function handleHistorySelect(e) {
		const item = e.detail;
		if (item.tab) activeTab = item.tab;
		if (item.jsonStr) { jsonStr = item.jsonStr; rawResult = jsonStr; result = jsonStr; }
		else if (item.result) { result = item.result; rawResult = item.result; }
		showHistory = false;
	}

	const historyRenderer = (item) => ({
		icon: item.tab === 'n8n' ? '⚙️' : item.tab === 'make' ? '🔗' : '📦',
		title: item.description || 'Workflow',
		subtitle: item.tab || ''
	});

	function addLineNumbers(str) {
		return str.split('\n').map((l, i) => `${String(i + 1).padStart(3)} ${l}`).join('\n');
	}

	$: exportContent = activeTab === 'n8n' ? jsonStr : result;
</script>

<AppShell
	title={$t('apps.workflow.name')} icon="⚙️" credits={5}
	result={exportContent}
	{history}
	onExport={() => exportTXT(exportContent, `workflow.${activeTab === 'n8n' ? 'json' : 'txt'}`)}
	onShare={() => { const link = generateShareLink('workflow', exportContent); copyToClipboard(link); notify('Share link copied ✓', 'success'); }}
	onClear={clearAll}
	on:togglehistory={() => showHistory = !showHistory}
>
	<div class="wb-layout">
		<div class="wb-main">
			<!-- Tab Bar -->
			<div class="tab-bar">
				{#each TABS as tab}
					<button class="tab-btn" class:active={activeTab === tab.id} on:click={() => switchTab(tab.id)}>
						<span>{tab.emoji}</span> {tab.label}
					</button>
				{/each}
			</div>

			{#if !result && !jsonStr && !loading}
				<!-- Input Form -->
				<div class="wb-form">
					<label class="field-label" for="wb-desc">{$t('apps.workflow.descLabel')}</label>
					<textarea id="wb-desc" class="wb-textarea" rows="4" bind:value={description} placeholder={$t('apps.workflow.descPlaceholder')}></textarea>

					{#if activeTab === 'n8n'}
						<span class="field-label">{$t('apps.workflow.triggerType')}</span>
						<div class="type-pills">
							{#each TRIGGERS as tr}
								<button class="pill" class:active={triggerType === tr} on:click={() => triggerType = tr}>{tr}</button>
							{/each}
						</div>

						<span class="field-label">{$t('apps.workflow.complexity')}</span>
						<div class="type-pills">
							{#each COMPLEXITY as c}
								<button class="pill" class:active={complexity === c} on:click={() => complexity = c}>{c}</button>
							{/each}
						</div>

						<label class="wb-toggle">
							<input type="checkbox" bind:checked={errorHandling} />
							<span>{$t('apps.workflow.errorHandling')}</span>
						</label>
					{:else if activeTab === 'make'}
						<span class="field-label">{$t('apps.workflow.primaryModule')}</span>
						<div class="type-pills">
							{#each MAKE_MODULES as m}
								<button class="pill" class:active={makeModules === m} on:click={() => makeModules = m}>{m}</button>
							{/each}
						</div>
					{:else}
						<span class="field-label">{$t('apps.workflow.resourceType')}</span>
						<div class="type-pills">
							{#each RESOURCE_TYPES as rt}
								<button class="pill" class:active={resourceType === rt.id} on:click={() => resourceType = rt.id}>
									{rt.emoji} {rt.label}
								</button>
							{/each}
						</div>

						<span class="field-label">{$t('apps.workflow.level')}</span>
						<div class="type-pills">
							<button class="pill" class:active={resourceLevel === 'basic'} on:click={() => resourceLevel = 'basic'}>
								📗 {$t('apps.workflow.levelBasic')}
							</button>
							<button class="pill" class:active={resourceLevel === 'advanced'} on:click={() => resourceLevel = 'advanced'}>
								📕 {$t('apps.workflow.levelAdvanced')}
							</button>
						</div>
					{/if}

					<button class="action-btn" on:click={generate} disabled={!description.trim() || loading}>
						{TABS.find(t => t.id === activeTab)?.emoji || '⚙️'} {$t('apps.workflow.generateBtn')}
					</button>
				</div>
			{:else}
				<!-- Result View -->
				{#if activeTab === 'n8n' && validationStatus !== 'none'}
					<div class="validation-banner" class:valid={validationStatus === 'valid'} class:warning={validationStatus === 'warning'} class:error={validationStatus === 'error'}>
						{#if validationStatus === 'valid'}✅{:else if validationStatus === 'warning'}⚠️{:else}❌{/if}
						{validateJSON(jsonStr).msg}
					</div>
				{/if}

				<div class="wb-result" class:wb-split={activeTab === 'n8n' && parsed}>
					<!-- Left: content viewer -->
					<div class="wb-left" class:full={activeTab !== 'n8n' || !parsed}>
						<div class="json-toolbar">
							<span class="json-label">
								{activeTab === 'n8n' ? 'workflow.json' : activeTab === 'make' ? 'make-scenario.txt' : `${resourceType}.txt`}
							</span>
							<div class="json-actions">
								<button class="sm-btn" on:click={() => copyToClipboard(exportContent).then(() => notify('Copied ✓', 'success'))}>Copy</button>
								<button class="sm-btn" on:click={downloadFile}>Download</button>
								<button class="sm-btn" on:click={clearAll}>← New</button>
							</div>
						</div>
						<pre class="json-viewer">{loading ? rawResult || '⟳ Generating...' : activeTab === 'n8n' ? addLineNumbers(jsonStr) : result}</pre>
					</div>

					<!-- Right: n8n visual flow (only for n8n tab) -->
					{#if activeTab === 'n8n' && parsed}
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
	.wb-layout { display: flex; height: 100%; }
	.wb-main { flex: 1; overflow: auto; display: flex; flex-direction: column; }

	/* Tab bar */
	.tab-bar {
		display: flex; gap: 0; border-bottom: 1px solid var(--border); flex-shrink: 0;
		background: var(--bg-surface);
	}
	.tab-btn {
		flex: 1; padding: 8px 12px; font-family: var(--font-mono); font-size: 11px;
		background: transparent; border: none; border-bottom: 2px solid transparent;
		color: var(--text-muted); cursor: pointer; transition: all var(--transition);
		display: flex; align-items: center; justify-content: center; gap: 4px;
	}
	.tab-btn:hover { color: var(--text-primary); background: var(--bg-elevated); }
	.tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

	/* Form */
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

	/* Validation */
	.validation-banner {
		padding: 6px 12px; font-family: var(--font-mono); font-size: 11px; text-align: center; flex-shrink: 0;
	}
	.validation-banner.valid { background: color-mix(in srgb, var(--success) 10%, var(--bg-surface)); color: var(--success); border-bottom: 1px solid color-mix(in srgb, var(--success) 30%, transparent); }
	.validation-banner.warning { background: color-mix(in srgb, var(--warning) 10%, var(--bg-surface)); color: var(--warning); border-bottom: 1px solid color-mix(in srgb, var(--warning) 30%, transparent); }
	.validation-banner.error { background: color-mix(in srgb, var(--danger) 10%, var(--bg-surface)); color: var(--danger); border-bottom: 1px solid color-mix(in srgb, var(--danger) 30%, transparent); }

	/* Results */
	.wb-result { display: flex; flex: 1; overflow: hidden; }
	.wb-left { width: 60%; display: flex; flex-direction: column; border-right: 1px solid var(--border); }
	.wb-left.full { width: 100%; border-right: none; }
	.wb-right { width: 40%; display: flex; flex-direction: column; overflow: auto; }

	.json-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
	.json-label { font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); }
	.json-actions { display: flex; gap: 4px; }
	.sm-btn { font-family: var(--font-mono); font-size: 10px; padding: 3px 8px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary); cursor: pointer; }
	.sm-btn:hover { border-color: var(--accent); color: var(--accent); }

	.json-viewer {
		flex: 1; overflow: auto; padding: 12px; font-family: var(--font-mono); font-size: 11px;
		color: var(--text-primary); line-height: 1.6; white-space: pre-wrap; margin: 0;
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
