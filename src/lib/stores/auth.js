import { writable } from 'svelte/store';

/** Always authenticated — no login required */
export const user = writable({ id: 'local', firstName: 'User' });

/** Auth loading complete immediately */
export const isLoading = writable(false);
