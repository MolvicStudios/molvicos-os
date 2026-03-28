/**
 * Simple in-memory rate limiter for Cloudflare Workers.
 * Uses a sliding window counter per IP.
 * Note: Each worker isolate has its own memory, so this is approximate
 * but effective against individual-IP abuse.
 */

const windows = new Map();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
	const now = Date.now();
	if (now - lastCleanup < CLEANUP_INTERVAL) return;
	lastCleanup = now;
	for (const [key, entry] of windows) {
		if (now - entry.start > entry.windowMs * 2) {
			windows.delete(key);
		}
	}
}

/**
 * Check if a request should be rate limited.
 * @param {string} ip - Client IP address
 * @param {object} opts
 * @param {string} opts.prefix - Route prefix for separate limits (e.g. 'ai', 'feedback')
 * @param {number} opts.maxRequests - Max requests per window (default: 30)
 * @param {number} opts.windowMs - Window duration in ms (default: 60_000 = 1 min)
 * @returns {{ limited: boolean, remaining: number, retryAfter?: number }}
 */
export function rateLimit(ip, { prefix = 'default', maxRequests = 30, windowMs = 60_000 } = {}) {
	cleanup();

	const key = `${prefix}:${ip}`;
	const now = Date.now();
	let entry = windows.get(key);

	if (!entry || now - entry.start > windowMs) {
		entry = { start: now, count: 0, windowMs };
		windows.set(key, entry);
	}

	entry.count++;

	if (entry.count > maxRequests) {
		const retryAfter = Math.ceil((entry.start + windowMs - now) / 1000);
		return { limited: true, remaining: 0, retryAfter };
	}

	return { limited: false, remaining: maxRequests - entry.count };
}

/**
 * Get client IP from a SvelteKit request event.
 */
export function getClientIP(event) {
	return (
		event.request.headers.get('cf-connecting-ip') ||
		event.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		event.getClientAddress?.() ||
		'unknown'
	);
}

/**
 * Returns a 429 Response if rate limited.
 * Use at the top of any API handler:
 *   const blocked = applyRateLimit(event, { prefix: 'ai', maxRequests: 20 });
 *   if (blocked) return blocked;
 */
export function applyRateLimit(event, opts = {}) {
	const ip = getClientIP(event);
	const result = rateLimit(ip, opts);

	if (result.limited) {
		return new Response(
			JSON.stringify({ error: 'Too many requests. Please try again later.' }),
			{
				status: 429,
				headers: {
					'Content-Type': 'application/json',
					'Retry-After': String(result.retryAfter),
				},
			}
		);
	}

	return null;
}
