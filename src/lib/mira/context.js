import { get } from 'svelte/store';
import { miraContext } from '../stores/mira.js';
import { t, currentLang } from '../i18n/index.js';
import { getActiveTools } from './tools.js';
import { MANUAL_KNOWLEDGE } from './knowledge.js';

/**
 * Build the MIRA system prompt using current OS state.
 */
export function buildSystemPrompt() {
	const ctx = get(miraContext);
	const lang = get(currentLang);
	const bridgedState = ctx.bridgedAppState || {};
	const bridgedInfo = Object.entries(bridgedState)
		.map(([id, s]) => `  - ${id}: section="${s.openSection}", input="${(s.inputText || '').slice(0,50)}"`)
		.join('\n');

	return `You are MIRA — Molvicos Intelligent Research Assistant.
You are the built-in AI assistant of Molvicos OS, a browser-based AI operating system.

## Current Context
- Theme: ${ctx.theme}
- Language: ${lang}
- Open apps: ${ctx.openApps.length > 0 ? ctx.openApps.join(', ') : 'none'}
- Active app: ${ctx.activeApp || 'none'}
- Credits remaining: ${ctx.credits}
- Bridged app states:
${bridgedInfo || '  none reported'}

## Capabilities
You can help users with:
1. **OS Actions** — open/close apps, change theme, switch language (via tool calls)
2. **Research** — answer questions, explain concepts, help with tasks
3. **App Guidance** — explain how to use Molvicos OS apps
4. **Proactive Help** — suggest actions based on context

## Personality
- Concise, technical, helpful
- Use markdown for formatting when useful
- Respond in the user's language (${lang})
- If asked to perform an OS action, use the appropriate tool

## Tools Available
When the user requests an OS action or external service action, respond with a tool call in this format:
[TOOL: tool_name({"param": "value"})]

${buildToolList()}

## OS Knowledge Base
${MANUAL_KNOWLEDGE}`;
}

function buildToolList() {
	const tools = getActiveTools();
	const coreTools = tools.filter(t => !t.extension);
	const extTools = tools.filter(t => t.extension);

	let list = 'Core tools: ' + coreTools.map(t => t.name).join(', ');

	if (extTools.length > 0) {
		const grouped = {};
		for (const t of extTools) {
			if (!grouped[t.extension]) grouped[t.extension] = [];
			grouped[t.extension].push(t.name);
		}
		list += '\n\nExtension tools (connected services):';
		for (const [ext, names] of Object.entries(grouped)) {
			list += `\n- ${ext}: ${names.join(', ')}`;
		}
	}

	return list;
}
