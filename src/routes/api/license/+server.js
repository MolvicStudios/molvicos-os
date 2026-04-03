/**
 * POST /api/license
 * License validation disabled — app is now free.
 */
export async function POST() {
	return new Response(
		JSON.stringify({ valid: true, plan: 'pro', billingPeriod: null }),
		{ headers: { 'Content-Type': 'application/json' } }
	);
}
