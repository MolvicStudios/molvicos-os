<script>
	import { onMount } from 'svelte';
	import { detectLang } from '$lib/i18n/index.js';
	import * as storage from '$lib/storage/local.js';
	import { goto } from '$app/navigation';
	import { miraOpen } from '$lib/stores/mira.js';

	import Wallpaper from '../../components/os/Wallpaper.svelte';
	import TopBar from '../../components/os/TopBar.svelte';
	import Desktop from '../../components/os/Desktop.svelte';
	import WindowManager from '../../components/os/WindowManager.svelte';
	import Dock from '../../components/os/Dock.svelte';
	import CommandPalette from '../../components/ui/CommandPalette.svelte';
	import Notification from '../../components/ui/Notification.svelte';
	import MiraButton from '../../components/mira/MiraButton.svelte';
	import MiraPanel from '../../components/mira/MiraPanel.svelte';
	import BugButton from '../../components/feedback/BugButton.svelte';
	import FeedbackModal from '../../components/feedback/FeedbackModal.svelte';
	import FeedbackToast from '../../components/feedback/FeedbackToast.svelte';
	import UpgradeModal from '../../components/ui/UpgradeModal.svelte';
	import { checkMonthlyRefill } from '$lib/plans/credits.js';

	onMount(() => {
		detectLang();
		checkMonthlyRefill();
		if (!storage.storage.isOnboardingComplete()) {
			goto('/onboarding');
		}
	});

	$: panelOpen = $miraOpen;
</script>

<svelte:head>
	<title>Molvicos OS</title>
</svelte:head>

<div class="os-viewport" class:mira-shift={panelOpen}>
	<Wallpaper />
	<TopBar />
	<Desktop />
	<WindowManager />
	<Dock />
	<CommandPalette />
	<Notification />
</div>

<MiraButton />
<MiraPanel />
<BugButton />
<FeedbackModal />
<FeedbackToast />
<UpgradeModal />

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
