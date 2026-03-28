import { openApp, closeApp, theme, notify } from '../stores/os.js';
import { setLang } from '../i18n/index.js';
import { getApp, APPS } from '../apps.js';
import { addMessage } from '../stores/mira.js';
import { canUse } from '../plans/gates.js';

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
 * Execute a MIRA tool call and return a result object.
 */
export async function executeTool(toolName, args) {
	try {
		const proActions = ['open_app', 'close_app', 'change_theme', 'change_language'];
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

			default:
				return { success: false, data: `Unknown tool: ${toolName}` };
		}
	} catch (e) {
		return { success: false, data: e.message };
	}
}

/**
 * Parse tool calls from assistant response text.
 * Format: [TOOL: name({"key": "value"})]
 */
export function parseToolCalls(text) {
	const pattern = /\[TOOL:\s*(\w+)\((\{[^}]+\})\)\]/g;
	const calls = [];
	let match;
	while ((match = pattern.exec(text)) !== null) {
		try {
			const name = match[1];
			const args = JSON.parse(match[2]);
			calls.push({ name, args });
		} catch {
			// Skip malformed tool calls
		}
	}
	return calls;
}

/**
 * Process tool calls found in response, execute them, and add tool messages.
 */
export async function processToolCalls(text) {
	const calls = parseToolCalls(text);
	for (const call of calls) {
		const result = executeTool(call.name, call.args);
		addMessage('tool', result.data, {
			toolCall: call,
			toolResult: result
		});
	}
	return calls.length;
}
