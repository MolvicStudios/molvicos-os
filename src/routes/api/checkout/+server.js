/**
 * POST /api/checkout
 * Checkout disabled — app is now free.
 */
export async function POST() {
	return new Response(JSON.stringify({ error: 'Checkout disabled — app is free' }), {
		status: 410,
		headers: { 'Content-Type': 'application/json' },
	});
}
