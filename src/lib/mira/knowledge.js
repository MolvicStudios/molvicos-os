/**
 * Molvicos OS knowledge base for MIRA assistant.
 * Used to answer technical questions about the OS.
 */
export const MANUAL_KNOWLEDGE = `
## Molvicos OS — Technical Reference (for MIRA)

### Applications (18 total)
**Core (Dock default):** Prompt Lab (optimize prompts, prompt library), Prospectly (B2B outreach), AIWorkSuite (AI Teams, invoices, proposals, contracts, rate calculator), Repurposer (content × 6 formats), Brief Gen (SEO briefs).
**Power:** Automations/Workflow (n8n/Make/scripts), Local Models (Ollama bridge), AI Terminal (conversational CLI), Dashboard (usage stats), Analytics (web analytics), App Store (marketplace), Extensions (connect services), Settings (config).
**Tools:** MailCraft (AI email writer), DAFO Analysis (SWOT strategy), Brand Name (name generator), Summarizer (text summary), ToneShifter (tone translator).

### AI Providers (6 cloud + Ollama)
- **Groq** (RECOMMENDED, free tier, ultra-fast) → App: llama-3.3-70b-versatile, MIRA: llama-3.1-8b-instant
- **Gemini** (free tier, 1M tokens/month) → gemini-1.5-flash
- **Mistral** (free tier) → mistral-small-latest
- **GitHub Models** (free tier) → gpt-4o-mini
- **OpenAI** (paid) → gpt-4o-mini
- **Anthropic** (paid) → claude-haiku-4-5 / claude-3-haiku
- **Ollama** (local, free, private) → user-selected model

### Extensions (11)
GitHub (repos, issues, PRs), Cloudflare (Pages, Workers, KV, DNS), Vercel (deploys, logs), Supabase (tables, queries, schema), Notion (pages, search), n8n (workflows, executions), Make (scenarios), Stripe (products, checkout, subscriptions), Resend (emails, domains), Telegram (messages), Lemon Squeezy (products, orders, subscriptions).

### Pricing
MolvicOS is 100% free with all features unlocked. No registration or account required. No credits system.

### Themes (5)
Neural Noir (dark), Ícaro (light), Synthwave (neon purple), Deep Ocean (blue), Matrix (green/black). All themes are free.

### Keyboard Shortcuts
Ctrl/Cmd+K: Command Palette. ↑/↓: Navigate. Enter: Execute. Escape: Close.

### Data Storage
localStorage: settings, API keys, usage, dock config, extensions.
IndexedDB (molvicos_db): prompts, conversations, files.
API keys never leave the browser — proxied through server-side routes.

### Onboarding (5 steps)
1. Language selection (EN/ES/DE/FR/ZH)
2. Hardware scan (CPU, RAM, GPU, benchmark → high/mid/low profile)
3. API key setup (with validation)
4. Local models (Ollama detection + model recommendations)
5. Interactive tutorial (23 steps covering all apps and features)

### Export & Share
Export as TXT, PDF (print dialog), share link (XOR-obfuscated URL), copy to clipboard.

### Hardware Profiles & Recommended Models
High (32GB+): llama3.3:70b, qwen2.5:32b, deepseek-r1:14b
Mid (16GB): llama3.2:8b, mistral:7b, qwen2.5:7b
Low (≤8GB): llama3.2:3b, phi3.5:mini

### Manual
Full user manual available at /manual/en.html (English) and /manual/es.html (Spanish). Users can print or save as PDF from those pages.
`;
