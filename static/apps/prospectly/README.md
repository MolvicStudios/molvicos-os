# Prospectly.shop

Generador de recursos IA + Herramienta de prospección B2B.

**Stack:** Vanilla HTML5 + CSS3 + JavaScript ES Modules  
**Hosting:** Cloudflare Pages + Cloudflare Worker (Groq proxy)  
**Modelo IA:** Groq API — llama-3.3-70b-versatile  
**Dominio:** prospectly.shop  

## Herramientas

1. **Generador de recursos IA** — Prompts, flujos n8n/Make, scripts Python/JS, guías, plantillas
2. **Kit de prospección B2B** — ICP, emails en frío, mensajes LinkedIn, scripts de llamada, objeciones, follow-up

## Deploy

```bash
# Worker (API proxy)
cd worker
wrangler secret put GROQ_API_KEY
wrangler deploy

# Frontend → Cloudflare Pages con dominio prospectly.shop
```

---

Desarrollado por [MolvicStudios](https://molvicstudios.pro) · molvicstudios@outlook.com
