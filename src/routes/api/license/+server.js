import { applyRateLimit } from '$lib/server/rate-limit.js';
import { getVerifiedUser } from '$lib/server/clerk-verify.js';
import { activateUserPro } from '$lib/server/db.js';

const YEARLY_VARIANT = '1456019';

export async function POST({ request, platform, ...event }) {
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

		// Validate with LemonSqueezy
		const res           = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
			method:  'POST',
			headers: { 'Content-Type': 'application/json' },
			body:    JSON.stringify({ license_key: licenseKey }),
		});
		const data          = await res.json();
		const valid         = data?.valid === true;
		const variantId     = String(data?.license_key?.variant_id || '');
		const billingPeriod = variantId === YEARLY_VARIANT ? 'yearly' : 'monthly';
		const userEmail     = data?.meta?.customer_email || data?.license_key?.user_email || '';

		if (valid) {
			const db        = platform?.env?.DB;
			const secretKey = platform?.env?.CLERK_SECRET_KEY;

			let clerkId = null;
			if (secretKey) {
				try {
					const jwtPayload = await getVerifiedUser(request, secretKey);
					clerkId = jwtPayload?.sub || null;
				} catch { /* no session — license-only */ }
			}

			if (clerkId) {
				await activateUserPro(db, {
					clerkId,
					email:       userEmail,
					billingPeriod,
					lsVariantId: variantId || null,
				});
				console.log(`[License] Pro activated for clerkId=${clerkId} (${billingPeriod})`);
			} else {
				console.warn(`[License] Valid license for ${userEmail} but no Clerk session — not persisted`);
			}
		}

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
