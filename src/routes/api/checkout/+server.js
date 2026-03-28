import { LS_CONFIG, buildCheckoutUrl } from '$lib/lemonsqueezy/client.js';
import { applyRateLimit } from '$lib/server/rate-limit.js';

export async function POST({ request, ...event }) {
	const blocked = applyRateLimit({ request, ...event }, { prefix: 'checkout', maxRequests: 10, windowMs: 60_000 });
	if (blocked) return blocked;

	try {
		const { variant, email, userId } = await request.json();
		const validVariants = [LS_CONFIG.monthlyVariant, LS_CONFIG.yearlyVariant];

		if (!validVariants.includes(variant)) {
			return new Response(JSON.stringify({ error: 'Invalid variant' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const url = buildCheckoutUrl(variant, email, userId);
		return new Response(JSON.stringify({ url }), {
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err) {
		return new Response(JSON.stringify({ error: err.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}
