import { writable } from 'svelte/store';

const DEFAULT_DOCK = ['promptlab', 'prospectly', 'aiworksuite', 'itineraries'];

function loadDock() {
	if (typeof localStorage === 'undefined') return DEFAULT_DOCK;
	try {
		const saved = localStorage.getItem('ms_dock_config');
		if (saved) {
			const parsed = JSON.parse(saved);
			if (Array.isArray(parsed) && parsed.length) return parsed;
		}
	} catch { /* ignore */ }
	return DEFAULT_DOCK;
}

export const dockConfig = writable(loadDock());

export function saveDockConfig() {
	let val;
	dockConfig.subscribe(v => (val = v))();
	localStorage.setItem('ms_dock_config', JSON.stringify(val));
}

export function resetDockConfig() {
	dockConfig.set([...DEFAULT_DOCK]);
	localStorage.setItem('ms_dock_config', JSON.stringify(DEFAULT_DOCK));
}
