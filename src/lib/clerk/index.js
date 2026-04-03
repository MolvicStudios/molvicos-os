/**
 * Clerk module — disabled. App is now free with no login required.
 * All functions are no-ops to avoid breaking any remaining imports.
 */

export async function initClerk() { return null; }
export async function getSessionToken() { return null; }
export function openSignIn() {}
export function openSignUp() {}
export function signOut() {}
export function getClerk() { return null; }
