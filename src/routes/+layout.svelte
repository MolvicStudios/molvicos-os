<script>
	import { onMount, onDestroy } from 'svelte';
	import { theme } from '$lib/stores/os.js';
	import { apiKeys } from '$lib/stores/models.js';
	import { userProfile } from '$lib/stores/user.js';
	import { storage } from '$lib/storage/local.js';
	import { detectLang } from '$lib/i18n/index.js';
	import { initConsoleTrap } from '$lib/feedback/console-trap.js';
	import { activatePro, deactivatePro } from '$lib/stores/plan.js';
	import '../app.css';

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

		// Init Clerk then hydrate plan from D1 (server is source of truth)
		try {
			const { PUBLIC_CLERK_PUBLISHABLE_KEY } = await import('$env/static/public').catch(
				() => ({ PUBLIC_CLERK_PUBLISHABLE_KEY: '' })
			);
			if (PUBLIC_CLERK_PUBLISHABLE_KEY && PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_')) {
				const isPlaceholder = /^pk_(test|live)_x+$/i.test(PUBLIC_CLERK_PUBLISHABLE_KEY);
				if (!isPlaceholder) {
					const { initClerk, getSessionToken } = await import('$lib/clerk/index.js');
					await initClerk(PUBLIC_CLERK_PUBLISHABLE_KEY).catch(console.warn);
					await syncPlanFromServer(getSessionToken);
				}
			}
		} catch {
			// Clerk not configured — continue without auth
		}
	});

	/**
	 * Call /api/me with the Clerk session token and update planStore.
	 * D1 is the source of truth; localStorage acts only as a cache.
	 */
	async function syncPlanFromServer(getSessionToken) {
		try {
			const token = await getSessionToken();
			const headers = token ? { Authorization: `Bearer ${token}` } : {};
			const res  = await fetch('/api/me', { headers });
			if (!res.ok) return;

			const { plan, billingPeriod, licenseKey } = await res.json();
			if (plan === 'pro') {
				activatePro(licenseKey || 'webhook-activated', billingPeriod || 'monthly');
			} else {
				deactivatePro();
			}
		} catch {
			// /api/me unreachable — keep localStorage state as fallback
		}
	}

	onDestroy(() => unsubs.forEach((fn) => fn()));
</script>

<slot />
