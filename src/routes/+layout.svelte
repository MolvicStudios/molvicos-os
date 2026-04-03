<script>
	import { onMount, onDestroy } from 'svelte';
	import { theme } from '$lib/stores/os.js';
	import { apiKeys } from '$lib/stores/models.js';
	import { userProfile } from '$lib/stores/user.js';
	import { storage } from '$lib/storage/local.js';
	import { detectLang } from '$lib/i18n/index.js';
	import { initConsoleTrap } from '$lib/feedback/console-trap.js';
	import '../app.css';

	let cookiesAccepted = false;

	if (typeof localStorage !== 'undefined') {
		cookiesAccepted = localStorage.getItem('cookies_accepted') === 'true';
	}

	function acceptCookies() {
		localStorage.setItem('cookies_accepted', 'true');
		cookiesAccepted = true;
	}

	// Restore critical stores synchronously (before children mount)
	if (typeof localStorage !== 'undefined') {
		const savedKeys = storage.get('ms_api_keys');
		if (savedKeys) apiKeys.set(savedKeys);

		const savedProfile = storage.get('ms_user_profile');
		if (savedProfile) userProfile.update((p) => ({ ...p, ...savedProfile }));

		const savedTheme = localStorage.getItem('ms_theme') || 'noir';
		theme.set(savedTheme);
	}

	let unsubs = [];

	onMount(async () => {
		initConsoleTrap();
		detectLang();

		// Apply theme to DOM
		const savedTheme = localStorage.getItem('ms_theme') || 'noir';
		document.documentElement.setAttribute('data-theme', savedTheme);

		// Subscribe to persist changes
		unsubs.push(theme.subscribe((t) => {
			document.documentElement.setAttribute('data-theme', t);
			storage.set('ms_theme', t);
		}));
		unsubs.push(apiKeys.subscribe((keys) => storage.set('ms_api_keys', keys)));
		unsubs.push(userProfile.subscribe((p) => storage.set('ms_user_profile', p)));
	});

	onDestroy(() => unsubs.forEach((fn) => fn()));
</script>

<slot />

{#if !cookiesAccepted}
<div class="cookie-banner">
  <p>We use cookies to improve your experience.
    <a href="/legal/cookies.html">Cookie Policy</a>
  </p>
  <button on:click={acceptCookies} class="cookie-accept-btn">Accept</button>
</div>
{/if}

<style>
.cookie-banner {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  max-width: 420px;
  background: #0f1520;
  border: 1px solid #1a2a20;
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  z-index: 9999;
  display: flex;
  gap: 1rem;
  align-items: center;
  font-size: 0.82rem;
  color: #5a7a6a;
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
}
.cookie-banner a { color: #00ff88; }
.cookie-banner p { margin: 0; flex: 1; line-height: 1.5; }
.cookie-accept-btn {
  background: #00ff88;
  color: #06090f;
  border: none;
  border-radius: 6px;
  padding: 0.4rem 0.9rem;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
