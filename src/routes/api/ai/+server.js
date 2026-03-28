import { json } from '@sveltejs/kit';
import { applyRateLimit } from '$lib/server/rate-limit.js';

const ENDPOINTS = {
	groq: 'https://api.groq.com/openai/v1/chat/completions',
	openai: 'https://api.openai.com/v1/chat/completions',
	gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
	mistral: 'https://api.mistral.ai/v1/chat/completions',
	ollama: 'http://localhost:11434/v1/chat/completions'
};

export async function POST({ request, ...event }) {
	const blocked = applyRateLimit({ request, ...event }, { prefix: 'ai', maxRequests: 20, windowMs: 60_000 });
	if (blocked) return blocked;

	const {
		messages,
		system,
		provider,
		apiKey,
		model,
		stream = true,
		temperature = 0.7
	} = await request.json();

	if (!apiKey && provider !== 'ollama') {
		return json({ error: 'No API key' }, { status: 401 });
	}

	if (provider === 'anthropic') {
		return handleAnthropic({ messages, system, apiKey, model, stream, temperature });
	}

	const endpoint = ENDPOINTS[provider];
	if (!endpoint) {
		return json({ error: 'Unsupported provider' }, { status: 400 });
	}

	const headers = { 'Content-Type': 'application/json' };
	if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

	const body = {
		model,
		stream,
		temperature,
		max_tokens: 2048,
		messages: system ? [{ role: 'system', content: system }, ...messages] : messages
	};

	try {
		const upstream = await fetch(endpoint, {
			method: 'POST',
			headers,
			body: JSON.stringify(body)
		});
		if (!upstream.ok) {
			const err = await upstream.text();
			console.error(`[AI Proxy] ${provider} error ${upstream.status}:`, err);
			return json({ error: `Provider error (${upstream.status})` }, { status: upstream.status });
		}
		return new Response(upstream.body, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache'
			}
		});
	} catch (err) {
		console.error('[AI Proxy] Internal error:', err);
		return json({ error: 'Internal proxy error' }, { status: 500 });
	}
}

async function handleAnthropic({ messages, system, apiKey, model, stream, temperature }) {
	const body = {
		model,
		stream,
		temperature,
		max_tokens: 2048,
		system,
		messages
	};
	const upstream = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01'
		},
		body: JSON.stringify(body)
	});
	if (!upstream.ok) {
		const err = await upstream.text();
		console.error(`[AI Proxy] Anthropic error ${upstream.status}:`, err);
		return new Response(JSON.stringify({ error: `Provider error (${upstream.status})` }), {
			status: upstream.status,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	return new Response(upstream.body, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache'
		}
	});
}

export async function OPTIONS() {
	return new Response(null, {
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	});
}
