// License validation removed — app is 100% free
export async function onRequestPost() {
  return new Response(JSON.stringify({ valid: true, plan: 'pro' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
