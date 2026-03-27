import { writable } from 'svelte/store';

export const apiKeys = writable({
	groq: '',
	openai: '',
	anthropic: '',
	gemini: '',
	mistral: ''
});

export const keyStatus = writable({
	groq: 'unchecked',
	openai: 'unchecked',
	anthropic: 'unchecked',
	gemini: 'unchecked',
	mistral: 'unchecked'
});

export const ollamaStatus = writable('offline');
export const ollamaModels = writable([]);
export const hardwareProfile = writable(null);
