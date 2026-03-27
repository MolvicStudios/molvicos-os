import { get } from 'svelte/store';
import {
	miraThinking,
	miraStreaming,
	miraMessages,
	miraProvider,
	addMessage,
	updateMessage
} from '../stores/mira.js';
import { apiKeys } from '../stores/models.js';
import { buildSystemPrompt } from './context.js';
import { processToolCalls } from './tools.js';
import { syncContext } from './proactive.js';

/**
 * Model mapping per provider for MIRA.
 */
export const MIRA_MODELS = {
	groq: 'llama-3.1-8b-instant',
	openai: 'gpt-4o-mini',
	anthropic: 'claude-3-haiku-20240307',
	gemini: 'gemini-1.5-flash',
	mistral: 'mistral-small-latest'
};

/**
 * Detect best available provider based on stored API keys.
 */
export function detectProvider() {
	const keys = get(apiKeys);
	const priority = ['groq', 'gemini', 'mistral', 'openai', 'anthropic'];
	for (const p of priority) {
		if (keys[p]) return p;
	}
	return null;
}

/**
 * Send a message to MIRA and stream the response.
 */
export async function sendMessage(userText) {
	syncContext();

	const provider = get(miraProvider) || detectProvider();
	if (!provider) {
		addMessage('assistant', 'No API key configured. Add one in Settings or during onboarding.');
		return;
	}

	const keys = get(apiKeys);
	const apiKey = keys[provider];
	if (!apiKey) {
		addMessage('assistant', `No API key found for ${provider}. Please add your key.`);
		return;
	}

	// Add user message
	addMessage('user', userText);

	// Build conversation history (last 20 messages for context window)
	const allMsgs = get(miraMessages);
	const history = allMsgs
		.filter(m => m.role === 'user' || m.role === 'assistant')
		.slice(-20)
		.map(m => ({ role: m.role, content: m.content }));

	const systemPrompt = buildSystemPrompt();

	miraThinking.set(true);
	miraStreaming.set(false);

	try {
		const response = await fetch('/api/mira', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				provider,
				apiKey,
				model: MIRA_MODELS[provider],
				system: systemPrompt,
				messages: history
			})
		});

		if (!response.ok) {
			const err = await response.text();
			addMessage('assistant', `Error: ${response.status} — ${err}`);
			miraThinking.set(false);
			return;
		}

		miraThinking.set(false);
		miraStreaming.set(true);

		// Create placeholder assistant message
		const msgId = addMessage('assistant', '');

		await processStream(response.body, msgId);

		miraStreaming.set(false);

		// Check for tool calls in the completed message
		const final = get(miraMessages).find(m => m.id === msgId);
		if (final?.content) {
			await processToolCalls(final.content);
		}
	} catch (e) {
		miraThinking.set(false);
		miraStreaming.set(false);
		addMessage('assistant', `Connection error: ${e.message}`);
	}
}

/**
 * Process an SSE stream from the MIRA API and update message content.
 */
async function processStream(body, msgId) {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let content = '';

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split('\n');
		buffer = lines.pop() || '';

		for (const line of lines) {
			if (line.startsWith('data: ')) {
				const data = line.slice(6).trim();
				if (data === '[DONE]') return;

				try {
					const json = JSON.parse(data);
					const delta =
						json.choices?.[0]?.delta?.content ||
						json.content?.[0]?.text ||
						'';
					if (delta) {
						content += delta;
						updateMessage(msgId, { content });
					}
				} catch {
					// Skip malformed SSE chunks
				}
			}
		}
	}
}
