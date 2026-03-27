<script>
	import { onMount } from 'svelte';
	import OnboardingShell from '../../components/onboarding/OnboardingShell.svelte';
	import { detectLang } from '$lib/i18n/index.js';

	onMount(() => {
		detectLang();
	});
</script>

<OnboardingShell />
