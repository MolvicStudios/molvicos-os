/**
 * Extension Registry — All available extensions for Molvicos OS.
 * Each extension: { id, name, emoji, description, color, fields[], tools[], execute(tool, args, config) }
 */

import { getExtensionConfig } from './store.js';

// ─── GitHub ────────────────────────────────────────────────────────
const github = {
	id: 'github',
	name: 'GitHub',
	emoji: '🐙',
	description: 'Repos, issues, PRs, push code',
	color: 'icon-gray',
	fields: [{ key: 'token', label: 'Personal Access Token', type: 'password', placeholder: 'ghp_...' }],
	tools: [
		{ name: 'github_create_repo', description: 'Create a GitHub repository', params: { name: 'string', private: 'boolean (optional, default true)', description: 'string (optional)' } },
		{ name: 'github_list_repos', description: 'List your GitHub repositories', params: { per_page: 'number (optional, default 10)' } },
		{ name: 'github_create_issue', description: 'Create an issue in a repo', params: { repo: 'string (owner/repo)', title: 'string', body: 'string (optional)' } },
		{ name: 'github_create_pr', description: 'Create a pull request', params: { repo: 'string (owner/repo)', title: 'string', head: 'string', base: 'string (default main)', body: 'string (optional)' } },
		{ name: 'github_get_repo', description: 'Get repo info', params: { repo: 'string (owner/repo)' } },
	],
	execute: async (tool, args) => {
		const { token } = getExtensionConfig('github');
		const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/vnd.github+json' };
		const api = 'https://api.github.com';
		switch (tool) {
			case 'github_create_repo': {
				const r = await fetch(`${api}/user/repos`, { method: 'POST', headers: h, body: JSON.stringify({ name: args.name, private: args.private !== false, description: args.description || '' }) });
				const d = await r.json();
				return r.ok ? { success: true, data: `Created repo: ${d.html_url}` } : { success: false, data: d.message };
			}
			case 'github_list_repos': {
				const r = await fetch(`${api}/user/repos?per_page=${args.per_page || 10}&sort=updated`, { headers: h });
				const d = await r.json();
				return r.ok ? { success: true, data: d.map(r => `${r.full_name} (${r.private ? 'private' : 'public'})`).join('\n') } : { success: false, data: d.message };
			}
			case 'github_create_issue': {
				const r = await fetch(`${api}/repos/${args.repo}/issues`, { method: 'POST', headers: h, body: JSON.stringify({ title: args.title, body: args.body || '' }) });
				const d = await r.json();
				return r.ok ? { success: true, data: `Issue created: ${d.html_url}` } : { success: false, data: d.message };
			}
			case 'github_create_pr': {
				const r = await fetch(`${api}/repos/${args.repo}/pulls`, { method: 'POST', headers: h, body: JSON.stringify({ title: args.title, head: args.head, base: args.base || 'main', body: args.body || '' }) });
				const d = await r.json();
				return r.ok ? { success: true, data: `PR created: ${d.html_url}` } : { success: false, data: d.message };
			}
			case 'github_get_repo': {
				const r = await fetch(`${api}/repos/${args.repo}`, { headers: h });
				const d = await r.json();
				return r.ok ? { success: true, data: `${d.full_name} — ⭐${d.stargazers_count} | ${d.language || 'N/A'} | ${d.description || ''}` } : { success: false, data: d.message };
			}
		}
	}
};

// ─── Cloudflare ────────────────────────────────────────────────────
const cloudflare = {
	id: 'cloudflare',
	name: 'Cloudflare',
	emoji: '☁️',
	description: 'Pages, Workers, KV, DNS',
	color: 'icon-amber',
	fields: [
		{ key: 'token', label: 'API Token', type: 'password', placeholder: 'Bearer ...' },
		{ key: 'accountId', label: 'Account ID', type: 'text', placeholder: 'Account ID' }
	],
	tools: [
		{ name: 'cf_list_pages', description: 'List Cloudflare Pages projects', params: {} },
		{ name: 'cf_list_workers', description: 'List Workers scripts', params: {} },
		{ name: 'cf_purge_cache', description: 'Purge cache for a zone', params: { zone_id: 'string' } },
		{ name: 'cf_list_domains', description: 'List DNS zones', params: {} },
		{ name: 'cf_list_kv', description: 'List KV namespaces', params: {} },
	],
	execute: async (tool, args) => {
		const { token, accountId } = getExtensionConfig('cloudflare');
		// Proxy a través del servidor para evitar CORS
		try {
			const r = await fetch('/api/cloudflare-proxy', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, accountId, tool, args })
			});
			return await r.json();
		} catch (err) {
			return { success: false, data: `Connection error: ${err.message}` };
		}
	}
};

// ─── Vercel ────────────────────────────────────────────────────────
const vercel = {
	id: 'vercel',
	name: 'Vercel',
	emoji: '▲',
	description: 'Deploys, logs, env vars',
	color: 'icon-gray',
	fields: [{ key: 'token', label: 'API Token', type: 'password', placeholder: 'Bearer ...' }],
	tools: [
		{ name: 'vercel_list_projects', description: 'List Vercel projects', params: {} },
		{ name: 'vercel_list_deployments', description: 'List recent deployments', params: { project: 'string (optional)' } },
		{ name: 'vercel_get_project', description: 'Get project details', params: { name: 'string' } },
	],
	execute: async (tool, args) => {
		const { token } = getExtensionConfig('vercel');
		const h = { Authorization: `Bearer ${token}` };
		const api = 'https://api.vercel.com';
		switch (tool) {
			case 'vercel_list_projects': {
				const r = await fetch(`${api}/v9/projects`, { headers: h });
				const d = await r.json();
				return r.ok ? { success: true, data: d.projects?.map(p => `${p.name} — ${p.framework || 'N/A'}`).join('\n') || 'No projects' } : { success: false, data: d.error?.message };
			}
			case 'vercel_list_deployments': {
				const q = args.project ? `?projectId=${args.project}&limit=5` : '?limit=5';
				const r = await fetch(`${api}/v6/deployments${q}`, { headers: h });
				const d = await r.json();
				return r.ok ? { success: true, data: d.deployments?.map(d => `${d.url} — ${d.state} (${d.meta?.githubCommitMessage || ''})`).join('\n') || 'No deployments' } : { success: false, data: d.error?.message };
			}
			case 'vercel_get_project': {
				const r = await fetch(`${api}/v9/projects/${args.name}`, { headers: h });
				const d = await r.json();
				return r.ok ? { success: true, data: `${d.name} — framework: ${d.framework}, repo: ${d.link?.repo || 'N/A'}` } : { success: false, data: d.error?.message };
			}
		}
	}
};

// ─── Supabase ──────────────────────────────────────────────────────
const supabase = {
	id: 'supabase',
	name: 'Supabase',
	emoji: '⚡',
	description: 'Tables, queries, schema',
	color: 'icon-green',
	fields: [
		{ key: 'url', label: 'Project URL', type: 'text', placeholder: 'https://xxx.supabase.co' },
		{ key: 'token', label: 'Service Role Key', type: 'password', placeholder: 'eyJ...' }
	],
	tools: [
		{ name: 'supa_list_tables', description: 'List tables in the database', params: {} },
		{ name: 'supa_run_query', description: 'Run a read-only SQL query', params: { query: 'string (SELECT only)' } },
		{ name: 'supa_get_schema', description: 'Get schema for a table', params: { table: 'string' } },
	],
	execute: async (tool, args) => {
		const { url, token } = getExtensionConfig('supabase');
		const h = { apikey: token, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
		switch (tool) {
			case 'supa_list_tables': {
				const r = await fetch(`${url}/rest/v1/`, { method: 'HEAD', headers: h });
				// Use RPC for table listing
				const r2 = await fetch(`${url}/rest/v1/rpc/`, { headers: h }).catch(() => null);
				// Fallback: query information_schema
				const r3 = await fetch(`${url}/rest/v1/rpc/exec_sql`, { method: 'POST', headers: h, body: JSON.stringify({ query: "SELECT table_name FROM information_schema.tables WHERE table_schema='public'" }) }).catch(() => null);
				if (r3?.ok) { const d = await r3.json(); return { success: true, data: d.map(r => r.table_name).join('\n') }; }
				return { success: true, data: 'Connected to Supabase. Use supa_get_schema with a specific table name.' };
			}
			case 'supa_run_query': {
				if (!args.query?.trim().toLowerCase().startsWith('select')) return { success: false, data: 'Only SELECT queries allowed for safety' };
				const r = await fetch(`${url}/rest/v1/rpc/exec_sql`, { method: 'POST', headers: h, body: JSON.stringify({ query: args.query }) });
				if (!r.ok) return { success: false, data: `Query error: ${r.status}` };
				const d = await r.json();
				return { success: true, data: JSON.stringify(d, null, 2).slice(0, 2000) };
			}
			case 'supa_get_schema': {
				const r = await fetch(`${url}/rest/v1/${args.table}?limit=0`, { headers: { ...h, Prefer: 'return=representation' } });
				if (!r.ok) return { success: false, data: `Table not found: ${args.table}` };
				return { success: true, data: `Table "${args.table}" exists. Headers: ${[...r.headers.entries()].filter(([k]) => k.startsWith('content')).map(([k, v]) => `${k}: ${v}`).join(', ')}` };
			}
		}
	}
};

// ─── Notion ────────────────────────────────────────────────────────
const notion = {
	id: 'notion',
	name: 'Notion',
	emoji: '📝',
	description: 'Pages, databases, search',
	color: 'icon-gray',
	fields: [{ key: 'token', label: 'Integration Token', type: 'password', placeholder: 'ntn_...' }],
	tools: [
		{ name: 'notion_search', description: 'Search pages in Notion', params: { query: 'string' } },
		{ name: 'notion_create_page', description: 'Create a page in a parent', params: { parent_id: 'string', title: 'string', content: 'string' } },
	],
	execute: async (tool, args) => {
		const { token } = getExtensionConfig('notion');
		const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' };
		const api = 'https://api.notion.com/v1';
		switch (tool) {
			case 'notion_search': {
				const r = await fetch(`${api}/search`, { method: 'POST', headers: h, body: JSON.stringify({ query: args.query, page_size: 10 }) });
				const d = await r.json();
				return r.ok ? { success: true, data: d.results?.map(p => `${p.object}: ${p.properties?.title?.title?.[0]?.plain_text || p.properties?.Name?.title?.[0]?.plain_text || p.id}`).join('\n') || 'No results' } : { success: false, data: d.message };
			}
			case 'notion_create_page': {
				const body = {
					parent: { page_id: args.parent_id },
					properties: { title: { title: [{ text: { content: args.title } }] } },
					children: [{ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: args.content || '' } }] } }]
				};
				const r = await fetch(`${api}/pages`, { method: 'POST', headers: h, body: JSON.stringify(body) });
				const d = await r.json();
				return r.ok ? { success: true, data: `Page created: ${d.url}` } : { success: false, data: d.message };
			}
		}
	}
};

// ─── n8n ───────────────────────────────────────────────────────────
const n8n = {
	id: 'n8n',
	name: 'n8n',
	emoji: '🔗',
	description: 'Workflows, executions, triggers',
	color: 'icon-red',
	fields: [
		{ key: 'url', label: 'Instance URL', type: 'text', placeholder: 'https://your-n8n.cloud' },
		{ key: 'token', label: 'API Key', type: 'password', placeholder: 'n8n_api_...' }
	],
	tools: [
		{ name: 'n8n_list_workflows', description: 'List n8n workflows', params: {} },
		{ name: 'n8n_activate_workflow', description: 'Activate/deactivate a workflow', params: { id: 'string', active: 'boolean' } },
		{ name: 'n8n_execute_workflow', description: 'Trigger a workflow execution', params: { id: 'string' } },
		{ name: 'n8n_get_executions', description: 'Get recent executions', params: { workflow_id: 'string (optional)' } },
	],
	execute: async (tool, args) => {
		const { url, token } = getExtensionConfig('n8n');
		const base = url.replace(/\/$/, '');
		const h = { 'X-N8N-API-KEY': token, 'Content-Type': 'application/json' };
		switch (tool) {
			case 'n8n_list_workflows': {
				const r = await fetch(`${base}/api/v1/workflows`, { headers: h });
				const d = await r.json();
				return r.ok ? { success: true, data: d.data?.map(w => `${w.id}: ${w.name} (${w.active ? 'active' : 'inactive'})`).join('\n') || 'No workflows' } : { success: false, data: 'Failed to fetch workflows' };
			}
			case 'n8n_activate_workflow': {
				const r = await fetch(`${base}/api/v1/workflows/${args.id}`, { method: 'PATCH', headers: h, body: JSON.stringify({ active: args.active !== false }) });
				return r.ok ? { success: true, data: `Workflow ${args.id} ${args.active !== false ? 'activated' : 'deactivated'}` } : { success: false, data: 'Failed to update workflow' };
			}
			case 'n8n_execute_workflow': {
				const r = await fetch(`${base}/api/v1/workflows/${args.id}/execute`, { method: 'POST', headers: h });
				const d = await r.json();
				return r.ok ? { success: true, data: `Execution started: ${d.data?.id || 'ok'}` } : { success: false, data: 'Failed to execute' };
			}
			case 'n8n_get_executions': {
				const q = args.workflow_id ? `?workflowId=${args.workflow_id}&limit=5` : '?limit=5';
				const r = await fetch(`${base}/api/v1/executions${q}`, { headers: h });
				const d = await r.json();
				return r.ok ? { success: true, data: d.data?.map(e => `${e.id}: ${e.status} (${e.workflowId})`).join('\n') || 'No executions' } : { success: false, data: 'Failed to fetch' };
			}
		}
	}
};

// ─── Make (Integromat) ─────────────────────────────────────────────
const make = {
	id: 'make',
	name: 'Make',
	emoji: '⚙️',
	description: 'Scenarios, connections, runs',
	color: 'icon-purple',
	fields: [
		{ key: 'token', label: 'API Token', type: 'password', placeholder: 'Token ...' },
		{ key: 'teamId', label: 'Team ID', type: 'text', placeholder: '12345' },
		{ key: 'zone', label: 'Zone', type: 'text', placeholder: 'eu1 or us1' }
	],
	tools: [
		{ name: 'make_list_scenarios', description: 'List Make scenarios', params: {} },
		{ name: 'make_run_scenario', description: 'Run a scenario', params: { scenario_id: 'string' } },
		{ name: 'make_toggle_scenario', description: 'Activate/deactivate scenario', params: { scenario_id: 'string', active: 'boolean' } },
	],
	execute: async (tool, args) => {
		const { token, teamId, zone } = getExtensionConfig('make');
		const api = `https://${zone || 'eu1'}.make.com/api/v2`;
		const h = { Authorization: `Token ${token}`, 'Content-Type': 'application/json' };
		switch (tool) {
			case 'make_list_scenarios': {
				const r = await fetch(`${api}/scenarios?teamId=${teamId}`, { headers: h });
				const d = await r.json();
				return r.ok ? { success: true, data: d.scenarios?.map(s => `${s.id}: ${s.name} (${s.islinked ? 'active' : 'off'})`).join('\n') || 'No scenarios' } : { success: false, data: 'Failed' };
			}
			case 'make_run_scenario': {
				const r = await fetch(`${api}/scenarios/${args.scenario_id}/run`, { method: 'POST', headers: h });
				return r.ok ? { success: true, data: `Scenario ${args.scenario_id} triggered` } : { success: false, data: 'Failed' };
			}
			case 'make_toggle_scenario': {
				const action = args.active !== false ? 'start' : 'stop';
				const r = await fetch(`${api}/scenarios/${args.scenario_id}/${action}`, { method: 'POST', headers: h });
				return r.ok ? { success: true, data: `Scenario ${args.scenario_id} ${action}ed` } : { success: false, data: 'Failed' };
			}
		}
	}
};

// ─── Stripe ────────────────────────────────────────────────────────
const stripe = {
	id: 'stripe',
	name: 'Stripe',
	emoji: '💳',
	description: 'Products, prices, subscriptions',
	color: 'icon-purple',
	fields: [{ key: 'token', label: 'Secret Key', type: 'password', placeholder: 'sk_live_...' }],
	tools: [
		{ name: 'stripe_list_products', description: 'List Stripe products', params: {} },
		{ name: 'stripe_create_product', description: 'Create a product with price', params: { name: 'string', price_cents: 'number', currency: 'string (default eur)', recurring: 'string (optional: month or year)' } },
		{ name: 'stripe_get_balance', description: 'Get account balance', params: {} },
		{ name: 'stripe_list_subs', description: 'List active subscriptions', params: {} },
		{ name: 'stripe_create_checkout', description: 'Create a checkout link', params: { price_id: 'string', mode: 'string (payment or subscription)' } },
	],
	execute: async (tool, args) => {
		const { token } = getExtensionConfig('stripe');
		const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' };
		const api = 'https://api.stripe.com/v1';
		const encode = obj => new URLSearchParams(obj).toString();
		switch (tool) {
			case 'stripe_list_products': {
				const r = await fetch(`${api}/products?limit=10&active=true`, { headers: h });
				const d = await r.json();
				return r.ok ? { success: true, data: d.data?.map(p => `${p.id}: ${p.name}`).join('\n') || 'No products' } : { success: false, data: d.error?.message };
			}
			case 'stripe_create_product': {
				const r1 = await fetch(`${api}/products`, { method: 'POST', headers: h, body: encode({ name: args.name }) });
				const p = await r1.json();
				if (!r1.ok) return { success: false, data: p.error?.message };
				const priceBody = { product: p.id, unit_amount: String(args.price_cents), currency: args.currency || 'eur' };
				if (args.recurring) priceBody['recurring[interval]'] = args.recurring;
				const r2 = await fetch(`${api}/prices`, { method: 'POST', headers: h, body: encode(priceBody) });
				const pr = await r2.json();
				return r2.ok ? { success: true, data: `Product: ${p.name} (${p.id})\nPrice: ${pr.id} — ${(args.price_cents / 100).toFixed(2)} ${args.currency || 'eur'}/${args.recurring || 'one-time'}` } : { success: false, data: pr.error?.message };
			}
			case 'stripe_get_balance': {
				const r = await fetch(`${api}/balance`, { headers: h });
				const d = await r.json();
				return r.ok ? { success: true, data: d.available?.map(b => `${(b.amount / 100).toFixed(2)} ${b.currency}`).join(', ') || '0' } : { success: false, data: d.error?.message };
			}
			case 'stripe_list_subs': {
				const r = await fetch(`${api}/subscriptions?limit=10&status=active`, { headers: h });
				const d = await r.json();
				return r.ok ? { success: true, data: d.data?.map(s => `${s.id}: ${s.plan?.nickname || s.plan?.id} — ${s.status}`).join('\n') || 'No subscriptions' } : { success: false, data: d.error?.message };
			}
			case 'stripe_create_checkout': {
				const body = encode({ 'line_items[0][price]': args.price_id, 'line_items[0][quantity]': '1', mode: args.mode || 'payment', success_url: 'https://molvicos.pro/success', cancel_url: 'https://molvicos.pro/cancel' });
				const r = await fetch(`${api}/checkout/sessions`, { method: 'POST', headers: h, body });
				const d = await r.json();
				return r.ok ? { success: true, data: `Checkout: ${d.url}` } : { success: false, data: d.error?.message };
			}
		}
	}
};

// ─── Resend ────────────────────────────────────────────────────────
const resend = {
	id: 'resend',
	name: 'Resend',
	emoji: '📧',
	description: 'Send emails, manage domains',
	color: 'icon-cyan',
	fields: [{ key: 'token', label: 'API Key', type: 'password', placeholder: 're_...' }],
	tools: [
		{ name: 'resend_send_email', description: 'Send an email', params: { from: 'string', to: 'string', subject: 'string', html: 'string' } },
		{ name: 'resend_list_domains', description: 'List verified domains', params: {} },
	],
	execute: async (tool, args) => {
		const { token } = getExtensionConfig('resend');
		const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
		const api = 'https://api.resend.com';
		switch (tool) {
			case 'resend_send_email': {
				const r = await fetch(`${api}/emails`, { method: 'POST', headers: h, body: JSON.stringify({ from: args.from, to: [args.to], subject: args.subject, html: args.html }) });
				const d = await r.json();
				return r.ok ? { success: true, data: `Email sent: ${d.id}` } : { success: false, data: d.message || 'Failed' };
			}
			case 'resend_list_domains': {
				const r = await fetch(`${api}/domains`, { headers: h });
				const d = await r.json();
				return r.ok ? { success: true, data: d.data?.map(d => `${d.name} (${d.status})`).join('\n') || 'No domains' } : { success: false, data: d.message || 'Failed' };
			}
		}
	}
};

// ─── Telegram Bot ──────────────────────────────────────────────────
const telegram = {
	id: 'telegram',
	name: 'Telegram',
	emoji: '✈️',
	description: 'Send messages, docs, photos',
	color: 'icon-blue',
	fields: [
		{ key: 'token', label: 'Bot Token', type: 'password', placeholder: '123456:ABC-DEF...' },
		{ key: 'chatId', label: 'Chat/Group ID', type: 'text', placeholder: '-100123456789' }
	],
	tools: [
		{ name: 'tg_send_message', description: 'Send a Telegram message', params: { text: 'string', chat_id: 'string (optional, uses default)' } },
		{ name: 'tg_get_updates', description: 'Get recent messages', params: {} },
	],
	execute: async (tool, args) => {
		const { token, chatId } = getExtensionConfig('telegram');
		const api = `https://api.telegram.org/bot${token}`;
		switch (tool) {
			case 'tg_send_message': {
				const r = await fetch(`${api}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: args.chat_id || chatId, text: args.text, parse_mode: 'HTML' }) });
				const d = await r.json();
				return d.ok ? { success: true, data: `Message sent (id: ${d.result?.message_id})` } : { success: false, data: d.description };
			}
			case 'tg_get_updates': {
				const r = await fetch(`${api}/getUpdates?limit=5&offset=-5`);
				const d = await r.json();
				return d.ok ? { success: true, data: d.result?.map(u => `${u.message?.from?.first_name}: ${u.message?.text?.slice(0, 80)}`).filter(Boolean).join('\n') || 'No recent messages' } : { success: false, data: d.description };
			}
		}
	}
};

// ─── Lemon Squeezy ─────────────────────────────────────────────────
const lemonsqueezy = {
	id: 'lemonsqueezy',
	name: 'Lemon Squeezy',
	emoji: '🍋',
	description: 'Products, orders, subscriptions',
	color: 'icon-amber',
	fields: [{ key: 'token', label: 'API Key', type: 'password', placeholder: 'eyJ...' }],
	tools: [
		{ name: 'ls_list_products', description: 'List Lemon Squeezy products', params: {} },
		{ name: 'ls_list_orders', description: 'List recent orders', params: {} },
		{ name: 'ls_list_subscriptions', description: 'List active subscriptions', params: {} },
		{ name: 'ls_get_store', description: 'Get store info', params: {} },
	],
	execute: async (tool, args) => {
		const { token } = getExtensionConfig('lemonsqueezy');
		const h = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.api+json', 'Content-Type': 'application/vnd.api+json' };
		const api = 'https://api.lemonsqueezy.com/v1';
		switch (tool) {
			case 'ls_list_products': {
				const r = await fetch(`${api}/products`, { headers: h });
				const d = await r.json();
				return r.ok ? { success: true, data: d.data?.map(p => `${p.id}: ${p.attributes.name} — $${(p.attributes.price / 100).toFixed(2)}`).join('\n') || 'No products' } : { success: false, data: 'Failed' };
			}
			case 'ls_list_orders': {
				const r = await fetch(`${api}/orders?page[size]=10&sort=-created_at`, { headers: h });
				const d = await r.json();
				return r.ok ? { success: true, data: d.data?.map(o => `#${o.attributes.order_number}: $${(o.attributes.total / 100).toFixed(2)} — ${o.attributes.status}`).join('\n') || 'No orders' } : { success: false, data: 'Failed' };
			}
			case 'ls_list_subscriptions': {
				const r = await fetch(`${api}/subscriptions?filter[status]=active`, { headers: h });
				const d = await r.json();
				return r.ok ? { success: true, data: d.data?.map(s => `${s.id}: ${s.attributes.product_name} — ${s.attributes.status}`).join('\n') || 'No subs' } : { success: false, data: 'Failed' };
			}
			case 'ls_get_store': {
				const r = await fetch(`${api}/stores`, { headers: h });
				const d = await r.json();
				const s = d.data?.[0]?.attributes;
				return r.ok && s ? { success: true, data: `${s.name} — ${s.url}\nTotal revenue: $${(s.total_revenue / 100).toFixed(2)}` } : { success: false, data: 'Failed' };
			}
		}
	}
};

// ─── Registry ──────────────────────────────────────────────────────
export const EXTENSIONS = [
	github,
	cloudflare,
	vercel,
	supabase,
	notion,
	n8n,
	make,
	stripe,
	resend,
	telegram,
	lemonsqueezy
];

export function getExtension(id) {
	return EXTENSIONS.find(e => e.id === id);
}

export function getExtensionByTool(toolName) {
	return EXTENSIONS.find(e => e.tools.some(t => t.name === toolName));
}
