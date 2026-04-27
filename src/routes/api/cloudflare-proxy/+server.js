import { json } from '@sveltejs/kit';

/**
 * Proxy endpoint for Cloudflare API calls.
 * Cloudflare API does not support CORS from browser origins,
 * so we proxy requests through the server.
 */
export async function POST({ request }) {
	try {
		const { token, accountId, tool, args } = await request.json();

		if (!token || !accountId) {
			return json({ success: false, data: 'Missing Cloudflare token or account ID' }, { status: 400 });
		}

		const h = {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		};
		const api = 'https://api.cloudflare.com/client/v4';

		let url, options = { method: 'GET', headers: h };

		switch (tool) {
			case 'cf_list_pages': {
				url = `${api}/accounts/${accountId}/pages/projects`;
				break;
			}
			case 'cf_list_workers': {
				url = `${api}/accounts/${accountId}/workers/scripts`;
				break;
			}
			case 'cf_purge_cache': {
				url = `${api}/zones/${args?.zone_id}/purge_cache`;
				options = { method: 'POST', headers: h, body: JSON.stringify({ purge_everything: true }) };
				break;
			}
			case 'cf_list_domains': {
				url = `${api}/zones?account.id=${accountId}`;
				break;
			}
			case 'cf_list_kv': {
				url = `${api}/accounts/${accountId}/storage/kv/namespaces`;
				break;
			}
			default:
				return json({ success: false, data: `Unknown tool: ${tool}` }, { status: 400 });
		}

		const r = await fetch(url, options);
		const d = await r.json();

		return json({
			success: d.success,
			data: d.success
				? formatResult(tool, d)
				: (d.errors?.[0]?.message || 'Cloudflare API error')
		});
	} catch (err) {
		return json({ success: false, data: `Proxy error: ${err.message}` }, { status: 500 });
	}
}

function formatResult(tool, d) {
	switch (tool) {
		case 'cf_list_pages':
			return d.result.map(p => `${p.name} — ${p.subdomain}`).join('\n') || 'No projects';
		case 'cf_list_workers':
			return d.result.map(w => w.id).join('\n') || 'No workers';
		case 'cf_purge_cache':
			return 'Cache purged';
		case 'cf_list_domains':
			return d.result.map(z => `${z.name} (${z.status})`).join('\n') || 'No zones';
		case 'cf_list_kv':
			return d.result.map(n => `${n.title} (${n.id})`).join('\n') || 'No KV namespaces';
		default:
			return 'Done';
	}
}
