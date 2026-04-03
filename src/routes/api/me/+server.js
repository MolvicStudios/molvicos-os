import { json } from '@sveltejs/kit';

/**
 * GET /api/me
 * App is now free with no auth — always returns unlocked status.
 */
export async function GET() {
	return json({
		plan: 'pro',
		billingPeriod: null,
		status: 'active',
	});
}
