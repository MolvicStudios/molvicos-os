import { writable, derived } from 'svelte/store';

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

/** True when no API keys are configured and Ollama is offline — enables demo mode. */
export const demoMode = derived(
	[apiKeys, ollamaStatus],
	([$apiKeys, $ollamaStatus]) => {
		const hasAnyKey = Object.values($apiKeys).some(k => k?.trim());
		return !hasAnyKey && $ollamaStatus !== 'online';
	}
);

/** Preferred model per provider (persisted to localStorage). */
const _savedProviderModels = typeof localStorage !== 'undefined'
	? JSON.parse(localStorage.getItem('ms_provider_models') || 'null')
	: null;

export const providerModels = writable(_savedProviderModels || {
	groq: 'llama-3.3-70b-versatile',
	openai: 'gpt-4o-mini',
	anthropic: 'claude-haiku-4-5-20251001',
	gemini: 'gemini-2.0-flash',
	mistral: 'mistral-small-latest',
	github: 'gpt-4o-mini'
});

providerModels.subscribe(v => {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem('ms_provider_models', JSON.stringify(v));
	}
});
