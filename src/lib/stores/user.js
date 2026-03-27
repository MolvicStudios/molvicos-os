import { writable } from 'svelte/store';

export const userProfile = writable({
	name: '',
	email: '',
	plan: 'free',
	credits: 30,
	creditsMax: 30,
	creditsResetDate: null,
	lang: 'en',
	theme: 'noir',
	onboardingComplete: false,
	licenseKey: null
});

export const isAuthenticated = writable(false);
