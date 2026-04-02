import { isAuthenticated, userProfile } from '$lib/stores/user.js';
import { user as clerkUser, isLoading } from '$lib/stores/auth.js';

let clerk;

function loadClerkScript() {
	return new Promise((resolve, reject) => {
		if (window.Clerk) return resolve();
		const s = document.createElement('script');
		s.src = 'https://frontend-api.clerk.services/npm/@clerk/clerk-js@5/dist/clerk.browser.js';
		s.crossOrigin = 'anonymous';
		s.onload = resolve;
		s.onerror = reject;
		document.head.appendChild(s);
	});
}

export async function initClerk(publishableKey) {
	if (!publishableKey) return null;
	try {
		// Load from CDN to avoid Rollup bundling/TDZ circular dependency issues
		await loadClerkScript();
		clerk = new window.Clerk(publishableKey);
		await clerk.load();

		const currentUser = clerk.user || null;
		clerkUser.set(currentUser);

		if (currentUser) {
			isAuthenticated.set(true);
			userProfile.update((p) => ({
				...p,
				name:  currentUser.firstName || currentUser.username || 'User',
				email: currentUser.primaryEmailAddress?.emailAddress || ''
			}));
		}

		clerk.addListener(({ user }) => {
			clerkUser.set(user || null);
			isAuthenticated.set(!!user);
		});

		return clerk;
	} catch (e) {
		console.warn('Clerk init failed:', e);
		return null;
	} finally {
		isLoading.set(false);
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
