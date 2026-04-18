import { applyRateLimit } from '$lib/server/rate-limit.js';

/**
 * MIRA Streaming API Proxy
 * Normalizes all providers to SSE stream output.
 * Supports: Groq, OpenAI, Gemini, Mistral (OpenAI-compatible) and Anthropic (custom).
 */

const PROVIDER_ENDPOINTS = {
	groq: 'https://api.groq.com/openai/v1/chat/completions',
	openai: 'https://api.openai.com/v1/chat/completions',
	mistral: 'https://api.mistral.ai/v1/chat/completions',
	gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
	anthropic: 'https://api.anthropic.com/v1/messages',
	github: 'https://models.inference.ai.azure.com/chat/completions'
};

export async function POST({ request, platform, ...event }) {
	const blocked = applyRateLimit({ request, ...event }, { prefix: 'mira', maxRequests: 20, windowMs: 60_000 });
	if (blocked) return blocked;

	try {
		const { provider, apiKey, model, system, messages } = await request.json();

		// Demo mode: route through Cloudflare Workers AI
		if (provider === 'demo') {
			if (!platform?.env?.AI) {
				return streamDemoFallback(system, messages);
			}
			return streamWorkersAI(platform.env.AI, system, messages);
		}

		if (!provider || !apiKey || !model || !messages) {
			return new Response('Missing required fields', { status: 400 });
		}

		if (!PROVIDER_ENDPOINTS[provider]) {
			return new Response('Unsupported provider', { status: 400 });
		}

		const sanitizedKey = String(apiKey).trim();

		if (provider === 'anthropic') {
			return streamAnthropic(sanitizedKey, model, system, messages);
		}

		return streamOpenAICompat(provider, sanitizedKey, model, system, messages);
	} catch (e) {
		console.error('[MIRA Proxy] Internal error:', e);
		return new Response('Internal proxy error', { status: 500 });
	}
}

/**
 * Stream from OpenAI-compatible endpoints (Groq, OpenAI, Mistral, Gemini).
 */
async function streamOpenAICompat(provider, apiKey, model, system, messages) {
	const url = PROVIDER_ENDPOINTS[provider];

	const body = {
		model,
		stream: true,
		messages: [{ role: 'system', content: system }, ...messages]
	};

	// Gemini uses key param instead of bearer
	let headers;
	let fetchUrl = url;

	if (provider === 'gemini') {
		fetchUrl = `${url}`;
		headers = {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${apiKey}`
		};
	} else {
		headers = {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${apiKey}`
		};
	}

	const upstream = await fetch(fetchUrl, {
		method: 'POST',
		headers,
		body: JSON.stringify(body)
	});

	if (!upstream.ok) {
		const errText = await upstream.text();
		console.error(`[MIRA Proxy] ${provider} error ${upstream.status}:`, errText);
		return new Response(`Provider error (${upstream.status})`, { status: upstream.status });
	}

	// Pass through the SSE stream
	return new Response(upstream.body, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		}
	});
}

/**
 * Stream from Anthropic (non-OpenAI format) and transform to OpenAI SSE format.
 */
async function streamAnthropic(apiKey, model, system, messages) {
	const upstream = await fetch(PROVIDER_ENDPOINTS.anthropic, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01'
		},
		body: JSON.stringify({
			model,
			max_tokens: 2048,
			system,
			messages,
			stream: true
		})
	});

	if (!upstream.ok) {
		const errText = await upstream.text();
		console.error(`[MIRA Proxy] Anthropic error ${upstream.status}:`, errText);
		return new Response(`Provider error (${upstream.status})`, { status: upstream.status });
	}

	// Transform Anthropic's SSE to OpenAI-compatible format
	const transformer = new TransformStream({
		transform(chunk, controller) {
			const text = new TextDecoder().decode(chunk);
			const lines = text.split('\n');

			for (const line of lines) {
				if (line.startsWith('data: ')) {
					const data = line.slice(6).trim();
					if (data === '[DONE]') {
						controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
						return;
					}
					try {
						const event = JSON.parse(data);
						if (event.type === 'content_block_delta' && event.delta?.text) {
							const normalized = {
								choices: [{ delta: { content: event.delta.text } }]
							};
							controller.enqueue(
								new TextEncoder().encode(`data: ${JSON.stringify(normalized)}\n\n`)
							);
						} else if (event.type === 'message_stop') {
							controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
						}
					} catch {
						// Skip malformed chunks
					}
				}
			}
		}
	});

	const stream = upstream.body.pipeThrough(transformer);

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		}
	});
}

/**
 * Stream from Cloudflare Workers AI (demo mode, production only).
 * Transforms Workers AI SSE format {"response":"token"} to OpenAI SSE format
 * {"choices":[{"delta":{"content":"token"}}]} so the client parser works unchanged.
 */
async function streamWorkersAI(AI, system, messages) {
	const allMessages = system
		? [{ role: 'system', content: system }, ...messages]
		: messages;

	const cfStream = await AI.run('@cf/meta/llama-3.1-8b-instruct', {
		stream: true,
		messages: allMessages
	});

	// Workers AI SSE: data: {"response":"token","p":"..."}\n\n
	// We transform to OpenAI SSE: data: {"choices":[{"delta":{"content":"token"}}]}\n\n
	let buffer = '';
	const transformer = new TransformStream({
		transform(chunk, controller) {
			buffer += new TextDecoder().decode(chunk);
			const lines = buffer.split('\n');
			buffer = lines.pop() ?? '';

			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed || trimmed === 'data: [DONE]') {
					if (trimmed === 'data: [DONE]') {
						controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
					}
					continue;
				}
				if (trimmed.startsWith('data: ')) {
					try {
						const json = JSON.parse(trimmed.slice(6));
						const token = json.response ?? '';
						if (token) {
							const out = JSON.stringify({ choices: [{ delta: { content: token } }] });
							controller.enqueue(new TextEncoder().encode(`data: ${out}\n\n`));
						}
					} catch {
						// skip malformed chunk
					}
				}
			}
		},
		flush(controller) {
			// flush any remaining buffer
			if (buffer.trim().startsWith('data: ')) {
				try {
					const json = JSON.parse(buffer.trim().slice(6));
					const token = json.response ?? '';
					if (token) {
						const out = JSON.stringify({ choices: [{ delta: { content: token } }] });
						controller.enqueue(new TextEncoder().encode(`data: ${out}\n\n`));
					}
				} catch {}
			}
			controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
		}
	});

	return new Response(cfStream.pipeThrough(transformer), {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		}
	});
}

/**
 * Local-dev fallback for demo mode (Workers AI not available).
 */
function streamDemoFallback(system, messages) {
	const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content || '';
	const reply = `[Demo Mode — local dev] I received: "${lastUser.slice(0, 80)}${lastUser.length > 80 ? '...' : ''}". Deploy to Cloudflare Pages to use the free Workers AI demo, or add an API key in Settings.`;
	const encoder = new TextEncoder();
	const stream = new ReadableStream({
		start(controller) {
			const data = JSON.stringify({ choices: [{ delta: { content: reply } }] });
			controller.enqueue(encoder.encode(`data: ${data}\n\n`));
			controller.enqueue(encoder.encode('data: [DONE]\n\n'));
			controller.close();
		}
	});
	return new Response(stream, {
		headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
	});
}
