/**
 * Molvicos OS knowledge base for MIRA assistant.
 * Used to answer technical questions about the OS.
 */
export const MANUAL_KNOWLEDGE = `
## Molvicos OS — Technical Reference (for MIRA)

### Applications (18 total)
**Core (Dock default):** Prompt Lab (optimize prompts, prompt library, 2 credits), Prospectly (B2B outreach, 2 credits), AIWorkSuite (AI Teams, invoices, proposals, contracts, rate calculator, 1 credit), Repurposer (content × 6 formats, 3 credits), Brief Gen (SEO briefs, 3 credits).
**Power:** Automations/Workflow (n8n/Make/scripts, 5 credits), Local Models (Ollama bridge, 0 credits), AI Terminal (conversational CLI, 1 credit), Dashboard (usage stats, 0 credits), Analytics (web analytics, 0 credits), App Store (marketplace, 0 credits), Extensions (connect services, 0 credits), Settings (config, 0 credits).
**Tools:** MailCraft (AI email writer, 2 credits), DAFO Analysis (SWOT strategy, 2 credits), Brand Name (name generator, 2 credits), Summarizer (text summary, 1 credit), ToneShifter (tone translator, 2 credits).

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

### Plans & Credits
**Free:** 50 credits/month (beta: unlimited), 25 prompts, 2 themes, 1 workspace.
**Pro ($24/mo or $199/yr):** Unlimited credits, unlimited prompts, 5 themes, 5 workspaces, full MIRA control, mobile app.
**Local models (Ollama) always cost 0 credits.**

### Themes (5)
Neural Noir (dark, free), Ícaro (light, free), Synthwave (neon purple, Pro), Deep Ocean (blue, Pro), Matrix (green/black, Pro).

### Keyboard Shortcuts
Ctrl/Cmd+K: Command Palette. ↑/↓: Navigate. Enter: Execute. Escape: Close.

### Data Storage
localStorage: settings, API keys, credits, usage, dock config, extensions.
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
