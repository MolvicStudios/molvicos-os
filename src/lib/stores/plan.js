import { writable } from 'svelte/store';

/**
 * Plan store — app is now 100% free, no restrictions.
 * Everything is permanently unlocked.
 */
export const planStore = writable({
	plan:           'pro',
	credits:        999999,
	creditsMax:     null,
	licenseKey:     null,
	licenseValid:   true,
	billingPeriod:  null,
	nextReset:      null,
});

export const upgradeModalOpen   = writable(false);
export const upgradeModalReason = writable({ feature: '', reason: '' });

export function openUpgradeModal() { /* no-op: app is free */ }
export function closeUpgradeModal() { upgradeModalOpen.set(false); }

export function activatePro() { /* no-op: already unlocked */ }
export function deactivatePro() { /* no-op: always pro */ }
