import { get } from 'svelte/store';
import { planStore } from '$lib/stores/plan.js';
import { CREDIT_COSTS, getPlan, isBetaMode } from './index.js';
import { storage } from '$lib/storage/local.js';
import { notify } from '$lib/stores/os.js';

const CREDITS_KEY   = 'ms_credits';
const RESET_KEY     = 'ms_credits_reset';
const USAGE_LOG_KEY = 'ms_usage_log';
const LOW_CREDIT_THRESHOLD = 5;
let lowCreditWarned = false;

export function canAfford(action) {
	const { plan, credits } = get(planStore);

	if (isBetaMode() || plan === 'pro') return true;
	if (CREDIT_COSTS[action] === 0) return true;

	return credits >= (CREDIT_COSTS[action] || 1);
}

export function deductCredits(action) {
	const cost = CREDIT_COSTS[action] ?? 1;
	if (cost === 0) return true;

	const { plan } = get(planStore);
	if (isBetaMode() || plan === 'pro') {
		logUsage(action, cost);
		return true;
	}

	const current = get(planStore).credits;
	if (current < cost) return false;

	planStore.update(s => ({ ...s, credits: s.credits - cost }));
	storage.set(CREDITS_KEY, get(planStore).credits);
	logUsage(action, cost);

	// Low credit warning
	const remaining = get(planStore).credits;
	if (remaining <= LOW_CREDIT_THRESHOLD && remaining > 0 && !lowCreditWarned) {
		lowCreditWarned = true;
		notify(`⚡ ${remaining} credits remaining this month`, 'warning');
	} else if (remaining <= 0) {
		notify('⚡ No credits left — upgrade to Pro or wait for monthly reset', 'error');
	}

	return true;
}

export function checkMonthlyRefill() {
	const { plan } = get(planStore);
	const p = getPlan(plan);
	if (!p.creditsPerMonth) return;

	const lastReset = storage.get(RESET_KEY);
	const now = new Date();
	const shouldReset = !lastReset ||
		new Date(lastReset).getMonth() !== now.getMonth() ||
		new Date(lastReset).getFullYear() !== now.getFullYear();

	if (shouldReset) {
		const newCredits = isBetaMode() ? 999999 : p.creditsPerMonth;
		planStore.update(s => ({ ...s, credits: newCredits }));
		storage.set(CREDITS_KEY, newCredits);
		storage.set(RESET_KEY, now.toISOString());
	}
}

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
