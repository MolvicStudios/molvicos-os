import { writable } from 'svelte/store';

/** Currently active app definition (null = home screen) */
export const mobileActiveApp = writable(null);

/** Loaded Svelte component for the active app */
export const mobileAppComponent = writable(null);
