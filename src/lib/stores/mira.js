import { writable, get } from 'svelte/store';

/** MIRA panel visibility */
export const miraOpen = writable(false);

/** Is MIRA currently processing */
export const miraThinking = writable(false);

/** Is MIRA currently streaming a response */
export const miraStreaming = writable(false);

/** Unread message count */
export const miraUnread = writable(0);

/**
 * Chat messages: Array<{
 *   id: string,
 *   role: 'user' | 'assistant' | 'tool',
 *   content: string,
 *   timestamp: number,
 *   toolCall?: { name: string, args: object },
 *   toolResult?: { success: boolean, data: any }
 * }>
 */
export const miraMessages = writable([]);

/** Proactive suggestion chips: Array<{ id: string, text: string, action?: string }> */
export const miraSuggestions = writable([]);

/** Current OS context snapshot for system prompt */
export const miraContext = writable({
	theme: 'noir',
	lang: 'en',
	openApps: [],
	activeApp: null,
	credits: 30,
	bridgedAppState: {}
});

/** Selected provider for MIRA (persisted) */
const savedMiraProvider = typeof localStorage !== 'undefined' ? localStorage.getItem('ms_mira_provider') : null;
export const miraProvider = writable(savedMiraProvider || 'auto');
miraProvider.subscribe(v => {
	if (typeof localStorage !== 'undefined') localStorage.setItem('ms_mira_provider', v);
});

/** Selected model for MIRA (persisted). Empty = use provider default. */
const savedMiraModel = typeof localStorage !== 'undefined' ? localStorage.getItem('ms_mira_model') : null;
export const miraModel = writable(savedMiraModel || '');
miraModel.subscribe(v => {
	if (typeof localStorage !== 'undefined') localStorage.setItem('ms_mira_model', v);
});

/** Whether user has explicitly chosen a model in the picker */
const savedMiraModelChosen = typeof localStorage !== 'undefined' ? localStorage.getItem('ms_mira_model_chosen') : null;
export const miraModelChosen = writable(savedMiraModelChosen === 'true');
miraModelChosen.subscribe(v => {
	if (typeof localStorage !== 'undefined') localStorage.setItem('ms_mira_model_chosen', String(v));
});

/** Web research mode toggle */
export const miraWebMode = writable(false);

let msgCounter = 0;

export function addMessage(role, content, extra = {}) {
	const msg = {
		id: `mira-${Date.now()}-${msgCounter++}`,
		role,
		content,
		timestamp: Date.now(),
		...extra
	};
	miraMessages.update(msgs => {
		const updated = [...msgs, msg];
		if (updated.length > 100) {
			// Warn the user about truncation
			const warningExists = updated.some(m => m._truncationWarning);
			const trimmed = updated.slice(-100);
			if (!warningExists) {
				trimmed.unshift({
					id: `mira-truncation-${Date.now()}`,
					role: 'assistant',
					content: '⚠️ Chat history was trimmed to the last 100 messages to maintain performance.',
					timestamp: Date.now(),
					_truncationWarning: true
				});
			}
			return trimmed;
		}
		return updated;
	});

	if (role === 'assistant' && !get(miraOpen)) {
		miraUnread.update(n => n + 1);
	}

	return msg.id;
}

export function updateMessage(id, partial) {
	miraMessages.update(msgs =>
		msgs.map(m => (m.id === id ? { ...m, ...partial } : m))
	);
}

export function clearChat() {
	miraMessages.set([]);
	miraSuggestions.set([]);
	miraUnread.set(0);
}

export function toggleMira() {
	miraOpen.update(v => {
		if (!v) miraUnread.set(0);
		return !v;
	});
}
