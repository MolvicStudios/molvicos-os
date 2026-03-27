import { writable } from 'svelte/store';
import { storage } from '$lib/storage/local.js';

const HISTORY_KEYS = {
	promptlab: 'ms_history_promptlab',
	repurposer: 'ms_history_repurposer',
	briefgen: 'ms_history_briefgen',
	workflow: 'ms_history_workflow',
	prospectly: 'ms_history_prospectly',
	aiworksuite: 'ms_history_aiworksuite',
	terminal: 'ms_history_terminal'
};

const MAX_HISTORY = 20;

export function createAppHistory(appId) {
	const key = HISTORY_KEYS[appId];
	const saved = storage.get(key) || [];
	const { subscribe, update, set } = writable(saved);

	return {
		subscribe,
		add(entry) {
			update((items) => {
				const next = [{ ...entry, id: crypto.randomUUID(), ts: Date.now() }, ...items].slice(
					0,
					MAX_HISTORY
				);
				storage.set(key, next);
				return next;
			});
		},
		remove(id) {
			update((items) => {
				const next = items.filter((i) => i.id !== id);
				storage.set(key, next);
				return next;
			});
		},
		clear() {
			set([]);
			storage.remove(key);
		}
	};
}
