import { get } from 'svelte/store';
import { feedbackSubmitting, feedbackSuccess, closeFeedback } from '$lib/stores/feedback.js';
import { formatActionLog } from './tracker.js';
import { formatErrorLog, clearErrorLog } from './console-trap.js';
import { sendFeedbackToStats } from './stats-client.js';
import { openWindows, activeApp, theme } from '$lib/stores/os.js';
import { userProfile } from '$lib/stores/user.js';
import { planStore } from '$lib/stores/plan.js';
import { apiKeys, ollamaStatus } from '$lib/stores/models.js';

export async function submitFeedback(formData) {
	feedbackSubmitting.set(true);

	try {
		const keys    = get(apiKeys);
		const profile = get(userProfile);
		const plan    = get(planStore);

		const osState = {
			openApps:            get(openWindows).map(w => w.id),
			activeApp:           get(activeApp),
			theme:               get(theme),
			lang:                profile.lang,
			plan:                plan.plan,
			credits:             plan.credits,
			ollamaOnline:        get(ollamaStatus) === 'online',
			providersConfigured: Object.keys(keys).filter(k => keys[k]?.trim()),
			screenResolution:    `${window.innerWidth}×${window.innerHeight}`,
			url:                 window.location.href,
		};

		const report = {
			type:        formData.type,
			title:       formData.title,
			description: formData.description,
			severity:    formData.severity,
			userEmail:   profile.email || 'anonymous',
			osState,
			actionLog:   formatActionLog(),
			errorLog:    formatErrorLog(),
		};

		await sendFeedbackToStats(report);

		if (formData.type === 'bug') clearErrorLog();

		feedbackSuccess.set(true);
		setTimeout(() => closeFeedback(), 2500);

	} catch (err) {
		console.error('[Feedback] Submit failed:', err);
		feedbackSubmitting.set(false);
		throw err;
	}
}
