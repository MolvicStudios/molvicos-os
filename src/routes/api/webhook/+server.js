/**
 * POST /api/webhook
 * LemonSqueezy webhook — disabled. App is now free.
 */
export async function POST() {
	return new Response('Webhook disabled — app is free', { status: 200 });
}
