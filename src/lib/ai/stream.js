import { getActiveProvider } from '$lib/providers/active.js';
import { deductCredits, canAfford } from '$lib/plans/credits.js';

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Stream an AI response.
 * @param {object} opts
 * @param {string} opts.system      - System prompt
 * @param {array}  opts.messages    - Chat history [{role, content}]
 * @param {number} opts.temperature
 * @param {function} opts.onChunk   - Called with (delta, fullSoFar)
 * @param {function} opts.onDone    - Called with full accumulated text
 * @param {function} opts.onError   - Called with error message string
 * @param {string} opts.action      - Credit action type (e.g. 'mira_message')
 * @param {number} opts.timeoutMs   - Request timeout in ms (default: 30000)
 */
export async function streamAI({
	system,
	messages,
	temperature = 0.7,
	onChunk,
	onDone,
	onError,
	action = 'mira_message',
	timeoutMs = DEFAULT_TIMEOUT_MS
}) {
	// Check and deduct credits
	if (!canAfford(action)) {
		onError?.('Not enough credits. Upgrade to Pro for unlimited credits.');
		return;
	}
	if (!deductCredits(action)) {
		onError?.('Not enough credits for this action.');
		return;
	}

	const active = getActiveProvider();
	if (!active) {
		onError?.('No AI provider configured. Add an API key in Settings.');
		return;
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const res = await fetch('/api/ai', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			signal: controller.signal,
			body: JSON.stringify({
				system,
				messages,
				provider: active.provider,
				apiKey: active.key,
				model: active.model,
				temperature,
				stream: true
			})
		});

		if (!res.ok) throw new Error(`API error ${res.status}`);

		const reader = res.body.getReader();
		const decoder = new TextDecoder();
		let full = '';
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (!line.startsWith('data: ')) continue;
				const raw = line.slice(6).trim();
				if (raw === '[DONE]') continue;
				try {
					const chunk = JSON.parse(raw);
					const delta = chunk.choices?.[0]?.delta?.content ?? chunk.delta?.text ?? '';
					if (delta) {
						full += delta;
						onChunk?.(delta, full);
					}
				} catch {}
			}
		}
		onDone?.(full);
	} catch (err) {
		if (err.name === 'AbortError') {
			onError?.('Request timed out. Please try again.');
		} else {
			onError?.(err.message);
		}
	} finally {
		clearTimeout(timeout);
	}
}
