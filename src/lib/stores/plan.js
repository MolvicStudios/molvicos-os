import { writable } from 'svelte/store';
import { storage } from '$lib/storage/local.js';

const savedPlan    = storage.get('ms_plan')    || 'free';
const savedCredits = storage.get('ms_credits') ?? 999999;
const savedLicense = storage.get('ms_license') || null;

export const planStore = writable({
	plan:           savedPlan,
	credits:        savedCredits,
	creditsMax:     savedPlan === 'pro' ? null : 50,
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
	planStore.update(s => ({
		...s,
		plan:          'pro',
		credits:       999999,
		creditsMax:    null,
		licenseKey,
		licenseValid:  true,
		billingPeriod,
	}));
	storage.set('ms_billing_period', billingPeriod);
}

export function deactivatePro() {
	planStore.update(s => ({
		...s,
		plan:         'free',
		credits:      50,
		creditsMax:   50,
		licenseValid: false,
	}));
}
