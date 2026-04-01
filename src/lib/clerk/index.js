import { isAuthenticated, userProfile } from '$lib/stores/user.js';

let clerk;

export async function initClerk(publishableKey) {
	if (!publishableKey) return null;
	try {
		const { Clerk } = await import('@clerk/clerk-js');
		clerk = new Clerk(publishableKey);
		await clerk.load();

		if (clerk.user) {
			isAuthenticated.set(true);
			userProfile.update((p) => ({
				...p,
				name:  clerk.user.firstName || clerk.user.username || 'User',
				email: clerk.user.primaryEmailAddress?.emailAddress || ''
			}));
		}

		clerk.addListener(({ user }) => {
			isAuthenticated.set(!!user);
		});

		return clerk;
	} catch (e) {
		console.warn('Clerk init failed:', e);
		return null;
	}
}

/** Returns a short-lived Clerk session JWT for use in Authorization headers. */
export async function getSessionToken() {
	try {
		return (await clerk?.session?.getToken()) || null;
	} catch {
		return null;
	}
}

export function openSignIn()  { clerk?.openSignIn(); }
export function openSignUp()  { clerk?.openSignUp(); }
export function signOut()     { clerk?.signOut(); }
export function getClerk()    { return clerk; }
