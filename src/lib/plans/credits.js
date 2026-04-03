import { storage } from '$lib/storage/local.js';

const USAGE_LOG_KEY = 'ms_usage_log';

/** Always affordable — no credit restrictions */
export function canAfford() {
	return true;
}

/** Always succeeds — no credit deduction */
export function deductCredits(action) {
	logUsage(action, 0);
	return true;
}

/** No-op — no monthly refill needed */
export function checkMonthlyRefill() {}

function logUsage(action, cost) {
	const log = storage.get(USAGE_LOG_KEY) || [];
	log.unshift({ action, cost, ts: Date.now() });
	storage.set(USAGE_LOG_KEY, log.slice(0, 200));
}

export function getUsageLog() {
	return storage.get(USAGE_LOG_KEY) || [];
}

export function getUsageStats() {
	const log = getUsageLog();
	const now = Date.now();
	const day   = 24 * 60 * 60 * 1000;
	const week  = 7 * day;
	const month = 30 * day;

	const totals = { day: 0, week: 0, month: 0, allTime: 0 };
	const byApp  = {};

	for (const entry of log) {
		totals.allTime += entry.cost;
		if (now - entry.ts < day)   totals.day   += entry.cost;
		if (now - entry.ts < week)  totals.week  += entry.cost;
		if (now - entry.ts < month) totals.month += entry.cost;
		byApp[entry.action] = (byApp[entry.action] || 0) + 1;
	}

	const favoriteApp = Object.entries(byApp)
		.sort((a, b) => b[1] - a[1])[0]?.[0] || null;

	return { totals, byApp, favoriteApp, totalActions: log.length };
}
