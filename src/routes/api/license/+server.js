import { applyRateLimit } from '$lib/server/rate-limit.js';

export async function POST({ request, ...event }) {
	const blocked = applyRateLimit({ request, ...event }, { prefix: 'license', maxRequests: 5, windowMs: 60_000 });
	if (blocked) return blocked;

	try {
		const { licenseKey } = await request.json();
		if (!licenseKey || typeof licenseKey !== 'string') {
			return new Response(JSON.stringify({ valid: false }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const res = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
			method:  'POST',
			headers: { 'Content-Type': 'application/json' },
			body:    JSON.stringify({ license_key: licenseKey }),
		});

		const data = await res.json();
		const valid = data?.valid === true;
		const variantId = String(data?.license_key?.variant_id || '');
		const billingPeriod = variantId === '1451168' ? 'yearly' : 'monthly';

		return new Response(
			JSON.stringify({ valid, plan: valid ? 'pro' : 'free', billingPeriod }),
			{ headers: { 'Content-Type': 'application/json' } }
		);
	} catch (err) {
		return new Response(JSON.stringify({ valid: false, error: err.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}
