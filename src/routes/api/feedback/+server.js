import { applyRateLimit } from '$lib/server/rate-limit.js';

const MAX_FIELD_LEN = 2000;
const VALID_TYPES = ['bug', 'feedback', 'feature'];
const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical', null];

function truncate(str, max = MAX_FIELD_LEN) {
	if (typeof str !== 'string') return '';
	return str.slice(0, max);
}

function validateFeedback(body) {
	if (!body || typeof body !== 'object') return 'Invalid payload';
	if (!body.site || typeof body.site !== 'string') return 'Missing site';
	if (!body.event || typeof body.event !== 'string') return 'Missing event';
	if (!body.data || typeof body.data !== 'object') return 'Missing data';

	const d = body.data;
	if (d.type && !VALID_TYPES.includes(d.type)) return 'Invalid type';
	if (d.severity && !VALID_SEVERITIES.includes(d.severity)) return 'Invalid severity';

	return null;
}

function sanitizePayload(body) {
	const d = body.data || {};
	return {
		site: truncate(String(body.site || ''), 100),
		event: truncate(String(body.event || ''), 50),
		timestamp: typeof body.timestamp === 'number' ? body.timestamp : Date.now(),
		data: {
			type: VALID_TYPES.includes(d.type) ? d.type : 'feedback',
			title: truncate(d.title),
			description: truncate(d.description),
			severity: VALID_SEVERITIES.includes(d.severity) ? d.severity : null,
			userEmail: truncate(d.userEmail, 200),
			osState: typeof d.osState === 'object' ? d.osState : {},
			actionLog: truncate(d.actionLog, 5000),
			errorLog: truncate(d.errorLog, 5000),
			sessionId: truncate(d.sessionId, 100),
			userAgent: truncate(d.userAgent, 300),
			appVersion: truncate(d.appVersion, 20),
		},
	};
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, ...event }) {
	const blocked = applyRateLimit({ request, ...event }, { prefix: 'feedback', maxRequests: 5, windowMs: 60_000 });
	if (blocked) return blocked;

	try {
		const body = await request.json();

		const error = validateFeedback(body);
		if (error) {
			return new Response(JSON.stringify({ error }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const sanitized = sanitizePayload(body);

		const res = await fetch('https://stats.molvicstudios.pro/api/feedback', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(sanitized),
		});

		return new Response(await res.text(), {
			status: res.status,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err) {
		return new Response(JSON.stringify({ error: 'Relay failed' }), {
			status: 502,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}

export function OPTIONS() {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		},
	});
}
