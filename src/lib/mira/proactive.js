import { get } from 'svelte/store';
import { miraSuggestions, miraContext } from '../stores/mira.js';
import { openWindows, activeApp, theme } from '../stores/os.js';
import { currentLang } from '../i18n/index.js';
import { planStore } from '../stores/plan.js';

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
	const suggestions = [];

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
export function initProactive() {
	updateSuggestions();
	return setInterval(updateSuggestions, 30000);
}
