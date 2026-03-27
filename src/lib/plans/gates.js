import { get } from 'svelte/store';
import { planStore, openUpgradeModal } from '$lib/stores/plan.js';
import { getPlan, isPro } from './index.js';

export function canUse(feature) {
	const { plan } = get(planStore);
	const p = getPlan(plan);

	switch (feature) {
		case 'mira_full':            return p.miraFull;
		case 'themes_premium':       return isPro(plan);
		case 'workspaces_multi':     return p.workspaces > 1;
		case 'prompt_lib_unlimited': return p.promptLibMax === null;
		case 'mobile_app':           return p.mobileApp;
		case 'early_access':         return p.earlyAccess;
		default:                     return true;
	}
}

export function requirePro(feature, reason = '') {
	if (canUse(feature)) return true;
	openUpgradeModal(feature, reason);
	return false;
}

export function canAddPrompt(currentCount) {
	const { plan } = get(planStore);
	const p = getPlan(plan);
	if (p.promptLibMax === null) return true;
	return currentCount < p.promptLibMax;
}

export function canAddWorkspace(currentCount) {
	const { plan } = get(planStore);
	const p = getPlan(plan);
	return currentCount < p.workspaces;
}
