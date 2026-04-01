import { json } from '@sveltejs/kit';
import { getVerifiedUser } from '$lib/server/clerk-verify.js';
import { getUserByClerkId, isPlanPro } from '$lib/server/db.js';
import { applyRateLimit } from '$lib/server/rate-limit.js';

/**
 * GET /api/me
 * Returns the authenticated user's plan status from D1.
 * Requires: Authorization: Bearer <clerk_session_token>
 */
export async function GET({ request, platform, ...event }) {
	const blocked = applyRateLimit({ request, ...event }, { prefix: 'me', maxRequests: 30, windowMs: 60_000 });
	if (blocked) return blocked;

	const secretKey = platform?.env?.CLERK_SECRET_KEY;
	if (!secretKey) {
		return json({ plan: 'free', billingPeriod: null });
	}

	let payload;
	try {
		payload = await getVerifiedUser(request, secretKey);
	} catch {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (!payload) {
		return json({ plan: 'free', billingPeriod: null });
	}

	const db   = platform?.env?.DB;
	const user = await getUserByClerkId(db, payload.sub);

	const isPro        = user ? isPlanPro(user.plan) : false;
	const billingPeriod = isPro ? (user.plan === 'annual' ? 'yearly' : 'monthly') : null;

	return json({
		clerkUserId:   payload.sub,
		plan:          isPro ? 'pro' : 'free',
		billingPeriod,
		status:        user?.status ?? 'active',
	});
}
