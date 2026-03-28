import { get } from 'svelte/store';
import { miraSuggestions, miraContext, addMessage, miraOpen } from '../stores/mira.js';
import { openWindows, activeApp, theme } from '../stores/os.js';
import { currentLang } from '../i18n/index.js';
import { planStore } from '../stores/plan.js';
import { apiKeys } from '../stores/models.js';

/**
 * Update miraContext from current OS state.
 */
export function syncContext() {
	const wins = get(openWindows);
	const plan = get(planStore);

	miraContext.set({
		theme: get(theme),
		lang: get(currentLang),
		openApps: wins.filter(w => !w.minimized).map(w => w.id),
		activeApp: get(activeApp),
		credits: plan?.credits ?? 30
	});
}

/**
 * Generate proactive suggestions based on current context.
 */
export function updateSuggestions() {
	syncContext();
	const ctx = get(miraContext);
	const keys = get(apiKeys);
	const suggestions = [];

	// Check if any API key is configured
	const hasAnyKey = Object.values(keys).some(k => k && k.trim());

	if (!hasAnyKey) {
		suggestions.push({ id: 's0', text: '🔑 Configure API keys', action: 'open_app:settings' });
	}

	if (ctx.openApps.length === 0) {
		suggestions.push({ id: 's1', text: 'Open PromptLab', action: 'open_app:promptlab' });
		suggestions.push({ id: 's2', text: 'Explore Local Models', action: 'open_app:localmodels' });
	}

	if (ctx.theme === 'noir') {
		suggestions.push({ id: 's3', text: 'Try light theme', action: 'change_theme:icaro' });
	} else {
		suggestions.push({ id: 's3', text: 'Switch to dark mode', action: 'change_theme:noir' });
	}

	if (ctx.openApps.includes('promptlab')) {
		suggestions.push({ id: 's4', text: 'Help me write a prompt', action: 'chat' });
	}

	// Limit to 3 suggestions
	miraSuggestions.set(suggestions.slice(0, 3));
}

/**
 * Start proactive suggestion engine — updates every 30s.
 */
let apiKeyAlerted = false;

/**
 * Check for missing API keys and proactively alert via MIRA.
 */
export function checkApiKeys() {
	if (apiKeyAlerted) return;
	const keys = get(apiKeys);
	const hasAnyKey = Object.values(keys).some(k => k && k.trim());
	if (!hasAnyKey) {
		apiKeyAlerted = true;
		addMessage('assistant',
			'👋 Welcome! I noticed you don\'t have any API keys configured yet. ' +
			'To use AI features, add at least one key in **Settings → AI & Models**. ' +
			'Groq and Gemini offer free tiers! Alternatively, install **Ollama** for free local AI.'
		);
	}
}

export function initProactive() {
	updateSuggestions();
	// Alert about missing API keys after a short delay
	setTimeout(checkApiKeys, 3000);
	return setInterval(updateSuggestions, 30000);
}
