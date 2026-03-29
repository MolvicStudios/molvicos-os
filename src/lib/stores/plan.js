import { writable } from 'svelte/store';
import { storage } from '$lib/storage/local.js';

// HMAC integrity key for plan store (prevents localStorage.setItem('ms_plan','pro') bypass)
const INTEGRITY_KEY = 'ms_plan_sig';
const HMAC_SECRET = 'molvicos-plan-integrity-2026';

function computeSignature(plan, license) {
	const data = `${plan}:${license || 'none'}:${HMAC_SECRET}`;
	let hash = 0;
	for (let i = 0; i < data.length; i++) {
		hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
	}
	return 'sig_' + Math.abs(hash).toString(36);
}

function verifyPlan(plan, license) {
	if (plan === 'free') return true;
	const saved = storage.get(INTEGRITY_KEY);
	return saved === computeSignature(plan, license);
}

const savedPlan    = storage.get('ms_plan')    || 'free';
const savedCredits = storage.get('ms_credits') ?? 30;
const savedLicense = storage.get('ms_license') || null;

// Verify integrity — if tampered, reset to free
const planValid = verifyPlan(savedPlan, savedLicense);
const initialPlan = planValid ? savedPlan : 'free';
if (!planValid && savedPlan === 'pro') {
	storage.set('ms_plan', 'free');
	console.warn('[Security] Plan integrity check failed — reset to free');
}

export const planStore = writable({
	plan:           initialPlan,
	credits:        planValid ? savedCredits : 30,
	creditsMax:     initialPlan === 'pro' ? null : 30,
	licenseKey:     savedLicense,
	licenseValid:   false,
	billingPeriod:  storage.get('ms_billing_period') || null,
	nextReset:      storage.get('ms_credits_reset') || null,
});

planStore.subscribe(s => {
	storage.set('ms_plan', s.plan);
	storage.set('ms_credits', s.credits);
	if (s.licenseKey) storage.set('ms_license', s.licenseKey);
});

export const upgradeModalOpen   = writable(false);
export const upgradeModalReason = writable({ feature: '', reason: '' });

export function openUpgradeModal(feature = '', reason = '') {
	upgradeModalReason.set({ feature, reason });
	upgradeModalOpen.set(true);
}

export function closeUpgradeModal() {
	upgradeModalOpen.set(false);
}

export function activatePro(licenseKey, billingPeriod = 'monthly') {
	const sig = computeSignature('pro', licenseKey);
	planStore.update(s => ({
		...s,
		plan:          'pro',
		credits:       999999,
		creditsMax:    null,
		licenseKey,
		licenseValid:  true,
		billingPeriod,
	}));
	storage.set(INTEGRITY_KEY, sig);
	storage.set('ms_billing_period', billingPeriod);
}

export function deactivatePro() {
	planStore.update(s => ({
		...s,
		plan:         'free',
		credits:      30,
		creditsMax:   30,
		licenseValid: false,
	}));
	storage.set(INTEGRITY_KEY, null);
}
