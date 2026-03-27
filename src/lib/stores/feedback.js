import { writable } from 'svelte/store';

export const feedbackModalOpen  = writable(false);
export const feedbackSubmitting = writable(false);
export const feedbackSuccess    = writable(false);

export const feedbackPrefill = writable({
	title:       '',
	description: '',
	type:        'bug',
	severity:    'medium',
});

export function openFeedback(mode = 'bug', prefill = {}) {
	feedbackPrefill.set({
		title: '', description: '', type: mode, severity: 'medium',
		...prefill,
	});
	feedbackSuccess.set(false);
	feedbackSubmitting.set(false);
	feedbackModalOpen.set(true);
}

export function closeFeedback() {
	feedbackModalOpen.set(false);
	feedbackSubmitting.set(false);
	feedbackSuccess.set(false);
}
