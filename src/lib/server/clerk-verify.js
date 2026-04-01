/**
 * Clerk JWT verification for Cloudflare Workers.
 * Uses crypto.subtle + Clerk JWKS — no external dependencies.
 */

let cachedJwks = null;
let cacheExpiry = 0;

function base64urlDecode(str) {
	const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
	const padding = '='.repeat((4 - (base64.length % 4)) % 4);
	return atob(base64 + padding);
}

async function fetchJwks(clerkSecretKey) {
	const now = Date.now();
	if (cachedJwks && now < cacheExpiry) return cachedJwks;

	const resp = await fetch('https://api.clerk.com/v1/jwks', {
		headers: { Authorization: `Bearer ${clerkSecretKey}` }
	});
	if (!resp.ok) throw new Error(`Clerk JWKS fetch failed: ${resp.status}`);

	cachedJwks = await resp.json();
	cacheExpiry = now + 5 * 60 * 1000; // 5-minute cache
	return cachedJwks;
}

/**
 * Verify a Clerk session JWT and return its payload.
 * Throws if invalid, expired, or key not found.
 *
 * @param {string} token  — Bearer token from Authorization header
 * @param {string} clerkSecretKey — CLERK_SECRET_KEY env var (sk_...)
 * @returns {Promise<{ sub: string, email?: string, exp: number, [key: string]: any }>}
 */
export async function verifyClerkToken(token, clerkSecretKey) {
	if (!token || !clerkSecretKey) throw new Error('Missing token or Clerk secret key');

	const parts = token.split('.');
	if (parts.length !== 3) throw new Error('Malformed JWT');

	let header, payload;
	try {
		header  = JSON.parse(base64urlDecode(parts[0]));
		payload = JSON.parse(base64urlDecode(parts[1]));
	} catch {
		throw new Error('Failed to decode JWT');
	}

	if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
		throw new Error('Token expired');
	}

	const jwks = await fetchJwks(clerkSecretKey);
	const jwk  = jwks.keys?.find((k) => k.kid === header.kid);
	if (!jwk) throw new Error('No matching JWKS key for kid: ' + header.kid);

	const key = await crypto.subtle.importKey(
		'jwk',
		jwk,
		{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
		false,
		['verify']
	);

	const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
	const sigBytes = Uint8Array.from(base64urlDecode(parts[2]), (c) => c.charCodeAt(0));

	const valid = await crypto.subtle.verify(
		{ name: 'RSASSA-PKCS1-v1_5' },
		key,
		sigBytes,
		signingInput
	);
	if (!valid) throw new Error('Invalid JWT signature');

	return payload;
}

/**
 * Extract and verify Clerk token from a Request's Authorization header.
 * Returns null (not throws) when no token is present — throws on bad tokens.
 *
 * @param {Request} request
 * @param {string}  clerkSecretKey
 * @returns {Promise<{ sub: string, [key: string]: any }|null>}
 */
export async function getVerifiedUser(request, clerkSecretKey) {
	const auth = request.headers.get('authorization') || '';
	if (!auth.startsWith('Bearer ')) return null;
	const token = auth.slice(7);
	return verifyClerkToken(token, clerkSecretKey);
}
