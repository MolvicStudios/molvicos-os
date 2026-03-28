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

/** Selected provider for MIRA */
export const miraProvider = writable('groq');

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
		return updated.length > 100 ? updated.slice(-100) : updated;
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
