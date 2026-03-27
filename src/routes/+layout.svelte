<script>
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/os.js';
	import { initConsoleTrap } from '$lib/feedback/console-trap.js';
	import '../app.css';

	onMount(async () => {
		initConsoleTrap();

		const savedTheme = localStorage.getItem('ms_theme') || 'noir';
		document.documentElement.setAttribute('data-theme', savedTheme);
		theme.set(savedTheme);
		theme.subscribe((t) => document.documentElement.setAttribute('data-theme', t));

		// Init Clerk (non-blocking, optional)
		try {
			const { PUBLIC_CLERK_PUBLISHABLE_KEY } = await import('$env/static/public').catch(
				() => ({ PUBLIC_CLERK_PUBLISHABLE_KEY: '' })
			);
			if (PUBLIC_CLERK_PUBLISHABLE_KEY) {
				const { initClerk } = await import('$lib/clerk/index.js');
				initClerk(PUBLIC_CLERK_PUBLISHABLE_KEY).catch(console.warn);
			}
		} catch {
			// Clerk not configured — continue without auth
		}
	});
</script>

<slot />
