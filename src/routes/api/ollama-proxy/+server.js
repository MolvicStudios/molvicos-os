import { json } from '@sveltejs/kit';

export async function POST({ request }) {
	try {
		const { url, method = 'POST', headers = {}, body } = await request.json();

		if (!url || typeof url !== 'string') {
			return json({ error: 'Missing url' }, { status: 400 });
		}

		const parsed = new URL(url);
		if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
			return json({ error: 'Only localhost allowed' }, { status: 403 });
		}

		const resp = await fetch(url, {
			method,
			headers: { 'Content-Type': 'application/json', ...headers },
			body: body ? JSON.stringify(body) : undefined
		});

		const data = await resp.json();
		return json(data, { status: resp.status });
	} catch (e) {
		return json({ error: e.message }, { status: 502 });
	}
}
