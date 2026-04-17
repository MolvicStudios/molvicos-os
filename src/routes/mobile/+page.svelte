<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import MobileShell from '../../components/mobile/MobileShell.svelte';
	import LangPickerModal from '../../components/onboarding/LangPickerModal.svelte';
	import * as storageLib from '$lib/storage/local.js';
	import { detectLang } from '$lib/i18n/index.js';

	let ready = false;
	let showLangPicker = false;

	onMount(() => {
		// Redirect true desktop users (wide screen, no touch) back to the full OS
		const isDesktop = window.innerWidth >= 1024 && !('ontouchstart' in window);
		if (isDesktop) {
			goto('/os', { replaceState: true });
			return;
		}

		detectLang();

		if (!storageLib.storage.isOnboardingComplete()) {
			showLangPicker = true;
		}

		ready = true;
	});

	function onLangDone() {
		showLangPicker = false;
		storageLib.storage.setOnboardingComplete(true);
	}
</script>

<svelte:head>
	<title>Molvicos OS</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
</svelte:head>

{#if ready}
	<div in:fade={{ duration: 200 }}>
		<MobileShell />
		{#if showLangPicker}
			<LangPickerModal on:done={onLangDone} />
		{/if}
	</div>
{/if}
