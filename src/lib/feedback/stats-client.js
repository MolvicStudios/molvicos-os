const STATS_WORKER_URL = 'https://stats.molvicstudios.pro';

export async function sendFeedbackToStats(report) {
	const event = {
		site:      'molvicos.pro',
		event:     report.type === 'bug' ? 'bug_report' : 'feedback',
		timestamp: Date.now(),
		data: {
			type:        report.type,
			title:       report.title,
			description: report.description,
			severity:    report.severity || null,
			userEmail:   report.userEmail || 'anonymous',
			osState:     report.osState,
			actionLog:   report.actionLog,
			errorLog:    report.errorLog,
			sessionId:   getSessionId(),
			userAgent:   navigator.userAgent,
			appVersion:  '0.1.0-beta',
		},
	};

	const res = await fetch(`${STATS_WORKER_URL}/api/feedback`, {
		method:  'POST',
		headers: { 'Content-Type': 'application/json' },
		body:    JSON.stringify(event),
	});

	if (!res.ok) throw new Error(`Stats Worker error: ${res.status}`);
	return res.json();
}

function getSessionId() {
	let id = sessionStorage.getItem('ms_session_id');
	if (!id) {
		id = crypto.randomUUID();
		sessionStorage.setItem('ms_session_id', id);
	}
	return id;
}
