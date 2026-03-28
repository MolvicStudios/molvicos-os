import { processWebhookEvent } from '$lib/lemonsqueezy/webhook.js';
import { applyRateLimit } from '$lib/server/rate-limit.js';

export async function POST({ request, ...event }) {
	const blocked = applyRateLimit({ request, ...event }, { prefix: 'webhook', maxRequests: 10, windowMs: 60_000 });
	if (blocked) return blocked;

	const body      = await request.text();
	const signature = request.headers.get('x-signature') || '';
	const secret    = import.meta.env.LS_WEBHOOK_SECRET;

	if (!secret || secret.length < 20) {
		console.error('[Webhook] LS_WEBHOOK_SECRET not configured or too weak (min 20 chars)');
		return new Response('Server misconfigured', { status: 500 });
	}

	const valid = await verifySignature(body, signature, secret);
	if (!valid) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		const event = JSON.parse(body);
		await processWebhookEvent(event);
		return new Response('OK', { status: 200 });
	} catch (err) {
		return new Response(err.message, { status: 500 });
	}
}

async function verifySignature(body, signature, secret) {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
	);
	const sigBytes = hexToBytes(signature);
	return crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(body));
}

function hexToBytes(hex) {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
	}
	return bytes;
}
