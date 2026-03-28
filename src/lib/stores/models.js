import { writable } from 'svelte/store';

export const apiKeys = writable({
	groq: '',
	openai: '',
	anthropic: '',
	gemini: '',
	mistral: '',
	github: ''
});

export const keyStatus = writable({
	groq: 'unchecked',
	openai: 'unchecked',
	anthropic: 'unchecked',
	gemini: 'unchecked',
	mistral: 'unchecked',
	github: 'unchecked'
});

export const ollamaStatus = writable('offline');
export const ollamaModels = writable([]);
export const hardwareProfile = writable(null);
