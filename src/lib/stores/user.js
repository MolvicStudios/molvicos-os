import { writable } from 'svelte/store';

export const userProfile = writable({
	name: '',
	email: '',
	lang: 'en',
	theme: 'noir',
	onboardingComplete: false
});

export const isAuthenticated = writable(false);
