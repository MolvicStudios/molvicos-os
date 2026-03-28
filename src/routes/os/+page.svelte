<script>
	import { onMount } from 'svelte';
	import { miraOpen } from '$lib/stores/mira.js';
	import { tutorialOpen } from '$lib/stores/os.js';

	import Wallpaper from '../../components/os/Wallpaper.svelte';
	import TopBar from '../../components/os/TopBar.svelte';
	import WindowManager from '../../components/os/WindowManager.svelte';
	import Dock from '../../components/os/Dock.svelte';
	import AppLauncher from '../../components/os/AppLauncher.svelte';
	import CommandPalette from '../../components/ui/CommandPalette.svelte';
	import Notification from '../../components/ui/Notification.svelte';
	import MiraButton from '../../components/mira/MiraButton.svelte';
	import MiraPanel from '../../components/mira/MiraPanel.svelte';
	import FeedbackModal from '../../components/feedback/FeedbackModal.svelte';
	import FeedbackToast from '../../components/feedback/FeedbackToast.svelte';
	import UpgradeModal from '../../components/ui/UpgradeModal.svelte';
	import { checkMonthlyRefill } from '$lib/plans/credits.js';
	import TutorialOverlay from '../../components/onboarding/TutorialOverlay.svelte';
	import LangPickerModal from '../../components/onboarding/LangPickerModal.svelte';
	import * as storage from '$lib/storage/local.js';

	let showLangPicker = false;
	let showLauncher = false;

	onMount(() => {
		checkMonthlyRefill();
		if (!storage.storage.isOnboardingComplete()) {
			showLangPicker = true;
		}
	});

	function onLangDone() {
		showLangPicker = false;
		tutorialOpen.set(true);
	}

	function onTutorialDone() {
		tutorialOpen.set(false);
		storage.storage.setOnboardingComplete(true);
	}

	$: panelOpen = $miraOpen;
</script>

<svelte:head>
	<title>Molvicos OS</title>
</svelte:head>

<div class="os-viewport" class:mira-shift={panelOpen}>
	<Wallpaper />
	<TopBar />
	<WindowManager />
	<Dock on:launcher={() => showLauncher = true} />
	<AppLauncher open={showLauncher} on:close={() => showLauncher = false} />
	<CommandPalette />
	<Notification />
</div>

<MiraButton />
<MiraPanel />
<FeedbackModal />
<FeedbackToast />
<UpgradeModal />

{#if showLangPicker}
	<LangPickerModal on:done={onLangDone} />
{/if}

{#if $tutorialOpen}
	<TutorialOverlay on:done={onTutorialDone} />
{/if}

<style>
	.os-viewport {
		position: fixed;
		inset: 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		transition: right 0.25s ease;
	}

	.os-viewport.mira-shift {
		right: 360px;
	}
</style>
