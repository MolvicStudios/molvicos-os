import { writable } from 'svelte/store';
import { safeGet, safeSet } from '$lib/storage/local.js';

/** Currently active app definition (null = home screen) */
export const mobileActiveApp = writable(null);

/** Loaded Svelte component for the active app */
export const mobileAppComponent = writable(null);

// ── Mobile Featured (3 large cards on home screen) ──────────────────────────
const DEFAULT_FEATURED = ['promptlab', 'prospectly', 'aiworksuite'];
const DEFAULT_NAV = ['promptlab', 'prospectly', 'aiworksuite'];

function loadFromLS(key, fallback) {
	if (typeof localStorage === 'undefined') return fallback;
	try {
		const saved = safeGet(key);
		if (saved) {
			const parsed = JSON.parse(saved);
			if (Array.isArray(parsed) && parsed.length) return parsed;
		}
	} catch { /* ignore */ }
	return fallback;
}

export const mobileFeaturedConfig = writable(loadFromLS('ms_mobile_featured', DEFAULT_FEATURED));
export const mobileNavConfig = writable(loadFromLS('ms_mobile_nav', DEFAULT_NAV));

export function saveMobileFeatured() {
	let val;
	mobileFeaturedConfig.subscribe((v) => (val = v))();
	safeSet('ms_mobile_featured', JSON.stringify(val));
}

export function saveMobileNav() {
	let val;
	mobileNavConfig.subscribe((v) => (val = v))();
	safeSet('ms_mobile_nav', JSON.stringify(val));
}

export function resetMobileConfigs() {
	mobileFeaturedConfig.set([...DEFAULT_FEATURED]);
	mobileNavConfig.set([...DEFAULT_NAV]);
	safeSet('ms_mobile_featured', JSON.stringify(DEFAULT_FEATURED));
	safeSet('ms_mobile_nav', JSON.stringify(DEFAULT_NAV));
}
