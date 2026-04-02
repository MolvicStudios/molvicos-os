import { writable } from 'svelte/store';

/** Clerk user object or null */
export const user = writable(null);

/** true while Clerk is still initializing */
export const isLoading = writable(true);
