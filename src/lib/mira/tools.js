import { openApp, closeApp, theme, notify } from '../stores/os.js';
import { setLang } from '../i18n/index.js';
import { getApp, APPS } from '../apps.js';
import { addMessage } from '../stores/mira.js';
import { canUse } from '../plans/gates.js';
import { EXTENSIONS, getExtensionByTool } from '../extensions/index.js';
import { isExtensionEnabled, getExtensionConfig } from '../extensions/store.js';

/**
 * MIRA tool definitions.
 */
export const MIRA_TOOLS = [
	{
		name: 'open_app',
		description: 'Open an application in Molvicos OS',
		params: { app_id: 'string — one of: ' + APPS.map(a => a.id).join(', ') }
	},
	{
		name: 'close_app',
		description: 'Close an open application',
		params: { app_id: 'string' }
	},
	{
		name: 'change_theme',
		description: 'Switch OS theme',
		params: { theme: 'string — "noir", "icaro", "synthwave", "ocean", or "matrix"' }
	},
	{
		name: 'change_language',
		description: 'Change the OS language',
		params: { lang: 'string — en, es, de, fr, zh' }
	},
	{
		name: 'suggest_prompt',
		description: 'Suggest a prompt for PromptLab',
		params: { prompt: 'string' }
	},
	{
		name: 'report_feedback',
		description: 'Open feedback/bug report form. Use when user says: report a bug, send feedback, request a feature, something is broken',
		params: { mode: 'string — bug, feedback, or feature', title: 'string (optional prefill)', description: 'string (optional prefill)' }
	}
];

/**
 * Get all active tool definitions (MIRA core + enabled extensions).
 */
export function getActiveTools() {
	const extensionTools = EXTENSIONS
		.filter(e => isExtensionEnabled(e.id))
		.flatMap(e => e.tools.map(t => ({ ...t, extension: e.id })));
	return [...MIRA_TOOLS, ...extensionTools];
}

/**
 * Execute a MIRA tool call and return a result object.
 */
export async function executeTool(toolName, args) {
	try {
		const proActions = ['close_app', 'change_theme', 'change_language'];
		if (proActions.includes(toolName) && !canUse('mira_full')) {
			return { success: false, data: 'OS actions require Pro plan. Upgrade to unlock MIRA full control.' };
		}

		switch (toolName) {
			case 'open_app': {
				const appDef = getApp(args.app_id);
				if (!appDef) return { success: false, data: `App "${args.app_id}" not found` };
				await openApp(appDef);
				return { success: true, data: `Opened ${appDef.emoji} ${args.app_id}` };
			}

			case 'close_app': {
				closeApp(args.app_id);
				return { success: true, data: `Closed ${args.app_id}` };
			}

			case 'change_theme': {
				const t = args.theme === 'icaro' ? 'icaro' : 'noir';
				theme.set(t);
				if (typeof document !== 'undefined') {
					document.documentElement.setAttribute('data-theme', t);
				}
				if (typeof localStorage !== 'undefined') {
					localStorage.setItem('ms_theme', JSON.stringify(t));
				}
				return { success: true, data: `Theme changed to ${t}` };
			}

			case 'change_language': {
				const validLangs = ['en', 'es', 'de', 'fr', 'zh'];
				if (!validLangs.includes(args.lang)) {
					return { success: false, data: `Invalid language: ${args.lang}` };
				}
				setLang(args.lang);
				return { success: true, data: `Language changed to ${args.lang}` };
			}

			case 'suggest_prompt': {
				notify(`💡 MIRA suggests: ${args.prompt}`, 'info');
				return { success: true, data: `Suggested prompt: "${args.prompt}"` };
			}

			case 'report_feedback': {
				const { openFeedback } = await import('../stores/feedback.js');
				const mode = ['bug', 'feedback', 'feature'].includes(args.mode) ? args.mode : 'bug';
				openFeedback(mode, { title: args.title || '', description: args.description || '' });
				const labels = { bug: '🐛 Bug Report', feedback: '💬 Feedback', feature: '✨ Feature Request' };
				return { success: true, data: `Opened ${labels[mode]} form` };
			}

			default: {
				// Check extension tools
				const ext = getExtensionByTool(toolName);
				if (ext && isExtensionEnabled(ext.id)) {
					const result = await ext.execute(toolName, args);
					return result || { success: false, data: 'No response from extension' };
				}
				return { success: false, data: `Unknown tool: ${toolName}` };
			}
		}
	} catch (e) {
		return { success: false, data: e.message };
	}
}

/**
 * Parse tool calls from assistant response text.
 * Handles multiple formats LLMs may produce:
 *   [TOOL: name({"key": "value"})]
 *   [TOOL: name({"key": "value", "nested": {"a": 1}})]
 *   TOOL: name({"key": "value"})
 *   <tool>name({"key": "value"})</tool>
 */
export function parseToolCalls(text) {
	const calls = [];

	// Primary format: [TOOL: name({...})]  — supports nested braces
	const primary = /\[TOOL:\s*(\w+)\((\{[\s\S]*?\})\)\]/g;
	let m;
	while ((m = primary.exec(text)) !== null) {
		try {
			calls.push({ name: m[1], args: JSON.parse(m[2]) });
		} catch {
			// Try fixing common LLM JSON quirks (single quotes, trailing commas)
			try {
				const fixed = m[2]
					.replace(/'/g, '"')
					.replace(/,\s*([}\]])/g, '$1');
				calls.push({ name: m[1], args: JSON.parse(fixed) });
			} catch { /* skip */ }
		}
	}
	if (calls.length) return calls;

	// Fallback — plain TOOL: without brackets
	const plain = /TOOL:\s*(\w+)\((\{[\s\S]*?\})\)/g;
	while ((m = plain.exec(text)) !== null) {
		try {
			calls.push({ name: m[1], args: JSON.parse(m[2]) });
		} catch { /* skip */ }
	}
	if (calls.length) return calls;

	// Fallback — XML-style <tool>name({...})</tool>
	const xml = /<tool>\s*(\w+)\((\{[\s\S]*?\})\)\s*<\/tool>/g;
	while ((m = xml.exec(text)) !== null) {
		try {
			calls.push({ name: m[1], args: JSON.parse(m[2]) });
		} catch { /* skip */ }
	}

	return calls;
}

/**
 * Process tool calls found in response, execute them, and add tool messages.
 */
export async function processToolCalls(text) {
	const calls = parseToolCalls(text);
	for (const call of calls) {
		const result = await executeTool(call.name, call.args);
		addMessage('tool', result.data, {
			toolCall: call,
			toolResult: result
		});
	}
	return calls.length;
}
