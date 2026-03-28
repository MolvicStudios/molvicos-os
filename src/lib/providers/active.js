import { get } from 'svelte/store';
import { apiKeys } from '$lib/stores/models.js';
import { ollamaStatus } from '$lib/stores/models.js';

const PRIORITY = ['groq', 'openai', 'anthropic', 'gemini', 'mistral', 'github'];
const MODELS = {
	groq: 'llama-3.3-70b-versatile',
	openai: 'gpt-4o-mini',
	anthropic: 'claude-haiku-4-5-20251001',
	gemini: 'gemini-1.5-flash',
	mistral: 'mistral-small-latest',
	github: 'gpt-4o-mini',
	ollama: null
};

export function getActiveProvider() {
	const keys = get(apiKeys);
	const cloud = PRIORITY.find((p) => keys[p]?.trim());
	if (cloud) return { provider: cloud, model: MODELS[cloud], key: keys[cloud] };
	if (get(ollamaStatus) === 'online') return { provider: 'ollama', model: null, key: null };
	return null;
}
