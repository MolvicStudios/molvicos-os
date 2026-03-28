import { writable, get } from 'svelte/store';

/** All open windows: Array<{ id, title, icon, component, width, height, x, y, credits, minimized }> */
export const openWindows = writable([]);

/** Window z-index order (array of window ids, last = top) */
export const windowOrder = writable([]);

/** Currently focused window id */
export const focusedWindow = writable(null);

/** Active app id (shown in topbar center) */
export const activeApp = writable(null);

/** Theme: 'noir' | 'icaro' */
export const theme = writable('noir');

/** Command palette open */
export const cmdPaletteOpen = writable(false);

/** Notifications queue: Array<{ id, message, type, timestamp }> */
export const notifications = writable([]);

/** Desktop icon positions { [appId]: { x, y } } */
export const iconPositions = writable({});

let windowCounter = 0;

export async function openApp(appDef) {
	const wins = get(openWindows);
	const existing = wins.find((w) => w.id === appDef.id);

	if (existing) {
		if (existing.minimized) {
			openWindows.update((ws) => ws.map((w) => (w.id === appDef.id ? { ...w, minimized: false } : w)));
		}
		focusApp(appDef.id);
		return;
	}

	const mod = await appDef.loader();

	const win = {
		id: appDef.id,
		title: appDef.title || appDef.id,
		icon: appDef.emoji || '📦',
		component: mod.default,
		width: appDef.defaultSize?.w || 700,
		height: appDef.defaultSize?.h || 500,
		x: 80 + (windowCounter % 8) * 30,
		y: 60 + (windowCounter % 8) * 30,
		credits: appDef.credits || 0,
		minimized: false,
		maximized: false,
		colorClass: appDef.colorClass || ''
	};

	windowCounter++;
	openWindows.update((ws) => [...ws, win]);
	focusApp(appDef.id);
}

export function closeApp(id) {
	openWindows.update((ws) => ws.filter((w) => w.id !== id));
	windowOrder.update((order) => order.filter((wid) => wid !== id));
	const order = get(windowOrder);
	if (order.length > 0) {
		focusApp(order[order.length - 1]);
	} else {
		focusedWindow.set(null);
		activeApp.set(null);
	}
}

export function minimizeApp(id) {
	openWindows.update((ws) => ws.map((w) => (w.id === id ? { ...w, minimized: true } : w)));
	const order = get(windowOrder).filter((wid) => wid !== id);
	windowOrder.set(order);
	if (order.length > 0) {
		focusApp(order[order.length - 1]);
	} else {
		focusedWindow.set(null);
		activeApp.set(null);
	}
}

export function maximizeApp(id) {
	openWindows.update((ws) => ws.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)));
}

export function focusApp(id) {
	windowOrder.update((order) => {
		const filtered = order.filter((wid) => wid !== id);
		return [...filtered, id];
	});
	focusedWindow.set(id);
	activeApp.set(id);
}

export function updateWindowPosition(id, x, y) {
	openWindows.update((ws) => ws.map((w) => (w.id === id ? { ...w, x, y } : w)));
}

export function updateWindowSize(id, width, height) {
	openWindows.update((ws) => ws.map((w) => (w.id === id ? { ...w, width, height } : w)));
}

export function notify(message, type = 'info') {
	const id = Date.now();
	notifications.update((n) => [...n, { id, message, type, timestamp: id }]);
	setTimeout(() => {
		notifications.update((n) => n.filter((item) => item.id !== id));
	}, 4000);
}
