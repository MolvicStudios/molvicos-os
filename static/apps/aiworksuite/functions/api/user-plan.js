// User plan lookup removed — app is 100% free
export async function onRequestGet() {
  return new Response(JSON.stringify({ plan: 'pro' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
