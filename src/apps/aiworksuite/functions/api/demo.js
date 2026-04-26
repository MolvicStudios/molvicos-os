/**
 * /api/demo — Cloudflare Workers AI endpoint
 * Zero-config AI fallback using @cf/meta/llama-3.1-8b-instruct
 * Used when no API key is configured (demo mode).
 */
const ALLOWED_ORIGINS = [
  'https://aiworksuite.pro',
  'https://www.aiworksuite.pro',
  'http://localhost:8788',
  'http://localhost:8787',
  'http://localhost:3000',
];

const DEMO_MODEL = '@cf/meta/llama-3.1-8b-instruct';
const DEMO_MAX_TOKENS = 2048; // usable response length
const DEMO_RATE_LIMIT = 20;   // calls per IP per hour
const DEMO_KV_TTL = 3600;     // 1 hour in seconds

export async function onRequestPost(context) {
  const { request, env } = context;

  // ── CORS origin check ────────────────────────────────────────────
  const origin = request.headers.get('Origin') || '';
  const isLocalhost = origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
  if (origin && !ALLOWED_ORIGINS.includes(origin) && !isLocalhost) {
    return new Response('Forbidden', { status: 403 });
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // ── Require Workers AI binding ───────────────────────────────────
  if (!env.AI) {
    return new Response(
      JSON.stringify({
        error: 'Workers AI no está vinculado. Ve a CF Pages → Settings → Functions → AI Bindings y activa "Workers AI".',
        bindingMissing: true,
      }),
      { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // ── Per-IP rate limiting (requires KV binding "RATE_KV") ─────────
  if (env.RATE_KV) {
    const ip = request.headers.get('CF-Connecting-IP') || 'anon';
    const key = `demo_rl:${ip}`;
    const count = parseInt(await env.RATE_KV.get(key) || '0', 10);
    if (count >= DEMO_RATE_LIMIT) {
      return new Response(
        JSON.stringify({
          error: 'Límite del modo demo alcanzado. Añade tu propia API key en Ajustes para uso ilimitado.',
          limitReached: true,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    context.waitUntil(
      env.RATE_KV.put(key, String(count + 1), { expirationTtl: DEMO_KV_TTL })
    );
  }

  // ── Parse + validate body ────────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('Bad Request', { status: 400, headers: corsHeaders });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response('Bad Request', { status: 400, headers: corsHeaders });
  }

  // Sanitize: keep only last 12 messages, limit content length
  const messages = body.messages
    .slice(-12)
    .filter(m => m && typeof m.role === 'string' && typeof m.content === 'string')
    .map(m => ({
      role: ['system', 'user', 'assistant'].includes(m.role) ? m.role : 'user',
      content: String(m.content).slice(0, 4000),
    }));

  if (messages.length === 0) {
    return new Response('Bad Request', { status: 400, headers: corsHeaders });
  }

  const max_tokens = Math.min(
    Number.isFinite(Number(body.max_tokens)) ? Number(body.max_tokens) : DEMO_MAX_TOKENS,
    DEMO_MAX_TOKENS
  );

  // ── Call Workers AI ──────────────────────────────────────────────
  let result;
  try {
    result = await env.AI.run(DEMO_MODEL, { messages, max_tokens });
  } catch (e) {
    const errMsg = e?.message || String(e) || 'unknown';
    return new Response(
      JSON.stringify({ error: 'Workers AI error: ' + errMsg }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // Workers AI returns { response: string } — normalize to OpenAI-compatible format
  const content = result?.response ?? result?.result ?? result?.generated_text ?? '';
  if (!content) {
    return new Response(
      JSON.stringify({ error: 'Workers AI devolvió una respuesta vacía.', raw: JSON.stringify(result) }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const responseBody = JSON.stringify({
    choices: [{ message: { role: 'assistant', content } }],
    model: DEMO_MODEL,
    demo: true,
  });

  return new Response(responseBody, {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

// OPTIONS preflight
export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
