import { json } from '@sveltejs/kit';
import { applyRateLimit } from '$lib/server/rate-limit.js';

export async function POST({ request, ...event }) {
	const blocked = applyRateLimit({ request, ...event }, { prefix: 'ollama', maxRequests: 30, windowMs: 60_000 });
	if (blocked) return blocked;

	try {
		const { url, method = 'POST', headers = {}, body } = await request.json();

		if (!url || typeof url !== 'string') {
			return json({ error: 'Missing url' }, { status: 400 });
		}

		const parsed = new URL(url);
		if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
			return json({ error: 'Only localhost allowed' }, { status: 403 });
		}

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 30_000);

		try {
			const resp = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json', ...headers },
				body: body ? JSON.stringify(body) : undefined,
				signal: controller.signal
			});

			const data = await resp.json();
			return json(data, { status: resp.status });
		} finally {
			clearTimeout(timeout);
		}
	} catch (e) {
		return json({ error: e.message }, { status: 502 });
	}
}
