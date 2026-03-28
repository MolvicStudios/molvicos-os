import { writable, get } from 'svelte/store';

/**
 * Extension config store.
 * Shape: { [extId]: { enabled: boolean, config: { token, ...extra fields } } }
 */
function loadExtensions() {
	if (typeof localStorage === 'undefined') return {};
	try {
		const saved = localStorage.getItem('ms_extensions');
		return saved ? JSON.parse(saved) : {};
	} catch { return {}; }
}

export const extensionConfigs = writable(loadExtensions());

extensionConfigs.subscribe(v => {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem('ms_extensions', JSON.stringify(v));
	}
});

export function enableExtension(id, config = {}) {
	extensionConfigs.update(s => ({ ...s, [id]: { enabled: true, config } }));
}

export function disableExtension(id) {
	extensionConfigs.update(s => {
		const copy = { ...s };
		if (copy[id]) copy[id] = { ...copy[id], enabled: false };
		return copy;
	});
}

export function updateExtensionConfig(id, config) {
	extensionConfigs.update(s => ({
		...s,
		[id]: { enabled: s[id]?.enabled ?? false, config: { ...s[id]?.config, ...config } }
	}));
}

export function isExtensionEnabled(id) {
	const s = get(extensionConfigs);
	return s[id]?.enabled === true;
}

export function getExtensionConfig(id) {
	const s = get(extensionConfigs);
	return s[id]?.config || {};
}
