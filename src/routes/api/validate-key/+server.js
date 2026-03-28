import { json } from '@sveltejs/kit';
import { applyRateLimit } from '$lib/server/rate-limit.js';

const PROVIDER_URLS = {
	groq: 'https://api.groq.com/openai/v1/models',
	openai: 'https://api.openai.com/v1/models',
	anthropic: 'https://api.anthropic.com/v1/messages',
	gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
	mistral: 'https://api.mistral.ai/v1/models',
	github: 'https://models.inference.ai.azure.com/models'
};

export async function POST({ request, ...event }) {
	const blocked = applyRateLimit({ request, ...event }, { prefix: 'validate-key', maxRequests: 10, windowMs: 60_000 });
	if (blocked) return blocked;

	try {
		const { provider, key } = await request.json();

		if (!provider || !key || !PROVIDER_URLS[provider]) {
			return json({ valid: false }, { status: 400 });
		}

		const sanitizedKey = String(key).trim();
		if (sanitizedKey.length < 10 || sanitizedKey.length > 256) {
			return json({ valid: false }, { status: 400 });
		}

		let url = PROVIDER_URLS[provider];
		let headers = {};
		let init = { method: 'GET', headers };

		if (provider === 'anthropic') {
			headers['x-api-key'] = sanitizedKey;
			headers['anthropic-version'] = '2023-06-01';
			headers['content-type'] = 'application/json';
			init = {
				method: 'POST',
				headers,
				body: JSON.stringify({
					model: 'claude-3-haiku-20240307',
					max_tokens: 1,
					messages: [{ role: 'user', content: 'hi' }]
				})
			};
		} else if (provider === 'gemini') {
			url += `?key=${encodeURIComponent(sanitizedKey)}`;
		} else {
			headers['Authorization'] = `Bearer ${sanitizedKey}`;
		}

		const resp = await fetch(url, init);
		const valid = resp.ok || resp.status === 200;

		return json({ valid });
	} catch {
		return json({ valid: false }, { status: 500 });
	}
}
