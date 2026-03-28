<script>
	import { onMount, onDestroy } from 'svelte';
	import { theme } from '$lib/stores/os.js';
	import { apiKeys } from '$lib/stores/models.js';
	import { userProfile } from '$lib/stores/user.js';
	import { storage } from '$lib/storage/local.js';
	import { detectLang } from '$lib/i18n/index.js';
	import { initConsoleTrap } from '$lib/feedback/console-trap.js';
	import '../app.css';

	let unsubs = [];

	onMount(async () => {
		initConsoleTrap();
		detectLang();

		// Restore theme
		const savedTheme = localStorage.getItem('ms_theme') || 'noir';
		document.documentElement.setAttribute('data-theme', savedTheme);
		theme.set(savedTheme);
		unsubs.push(theme.subscribe((t) => {
			document.documentElement.setAttribute('data-theme', t);
			storage.set('ms_theme', t);
		}));

		// Restore API keys
		const savedKeys = storage.get('ms_api_keys');
		if (savedKeys) apiKeys.set(savedKeys);
		unsubs.push(apiKeys.subscribe((keys) => storage.set('ms_api_keys', keys)));

		// Restore user profile
		const savedProfile = storage.get('ms_user_profile');
		if (savedProfile) userProfile.update((p) => ({ ...p, ...savedProfile }));
		unsubs.push(userProfile.subscribe((p) => storage.set('ms_user_profile', p)));

		// Init Clerk (non-blocking, optional)
		try {
			const { PUBLIC_CLERK_PUBLISHABLE_KEY } = await import('$env/static/public').catch(
				() => ({ PUBLIC_CLERK_PUBLISHABLE_KEY: '' })
			);
			if (PUBLIC_CLERK_PUBLISHABLE_KEY && PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_')) {
				const isPlaceholder = /^pk_(test|live)_x+$/i.test(PUBLIC_CLERK_PUBLISHABLE_KEY);
				if (!isPlaceholder) {
					const { initClerk } = await import('$lib/clerk/index.js');
					initClerk(PUBLIC_CLERK_PUBLISHABLE_KEY).catch(console.warn);
				}
			}
		} catch {
			// Clerk not configured — continue without auth
		}
	});

	onDestroy(() => unsubs.forEach((fn) => fn()));
</script>

<slot />
