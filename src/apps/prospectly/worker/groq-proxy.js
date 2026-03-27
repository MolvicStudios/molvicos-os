const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'
const ALLOWED_ORIGINS = [
  'https://prospectly.shop',
  'https://www.prospectly.shop',
  'https://prospectly.pages.dev',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:3000'
]

async function verifyLicense(license_key, env) {
  // Variant IDs: 1450628 = mensual (paga lo que quieras desde 2,99€)
  //              1455073 = anual  (paga lo que quieras desde 29€)
  const VALID_VARIANTS = ['1450628', '1455073']
  const LS_HEADERS = {
    'Authorization': `Bearer ${env.LEMONSQUEEZY_API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }

  // Step 1: Try to activate (idempotent — safe to call multiple times)
  const activateRes = await fetch(
    'https://api.lemonsqueezy.com/v1/licenses/activate',
    {
      method: 'POST',
      headers: LS_HEADERS,
      body: JSON.stringify({ license_key, instance_name: 'Prospectly Web' })
    }
  )
  const activateData = await activateRes.json()

  // If activation fails with a non-"already activated" error, try validate
  let data = activateData
  if (!activateData.activated && activateData.error !== 'This license key has already been activated.') {
    // Fall back to validate
    const validateRes = await fetch(
      'https://api.lemonsqueezy.com/v1/licenses/validate',
      {
        method: 'POST',
        headers: LS_HEADERS,
        body: JSON.stringify({ license_key })
      }
    )
    data = await validateRes.json()
  }

  const variantId = data?.meta?.variant_id?.toString()

  if (!variantId || !VALID_VARIANTS.includes(variantId)) {
    return { valid: false, plan: null }
  }

  // Accept: active, on_trial, or just-activated
  const valid = data.valid || data.activated
  const status = data?.license_key?.status
  if (!valid || (status === 'expired' || status === 'disabled')) {
    return { valid: false, plan: null, reason: 'subscription_inactive' }
  }

  const planType = variantId === '1450628' ? 'monthly' : 'annual'

  return {
    valid: true,
    plan: 'pro',
    plan_type: planType,
    expires: data?.license_key?.expires_at || null,
    activation_limit: data?.license_key?.activation_limit,
    activation_usage: data?.license_key?.activation_usage
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''
    const url = new URL(request.url)
    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin)
        ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
    if (!ALLOWED_ORIGINS.includes(origin)) return new Response('Forbidden', { status: 403 })

    // License verification endpoint
    if (request.method === 'POST' && url.pathname === '/api/verify-license') {
      try {
        const { license_key } = await request.json()
        if (!license_key || typeof license_key !== 'string') {
          return new Response(
            JSON.stringify({ valid: false, reason: 'missing_key' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        const result = await verifyLicense(license_key, env)
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (err) {
        return new Response(JSON.stringify({ valid: false, reason: 'server_error' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Groq proxy (default)
    try {
      const { messages, system } = await request.json()
      const groqRes = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: 'system', content: system }, ...messages],
          temperature: 0.6,
          max_tokens: 4096
        })
      })
      const data = await groqRes.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } catch(err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: corsHeaders
      })
    }
  }
}
