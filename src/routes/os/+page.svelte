<script>
	import { onMount } from 'svelte';
	import { miraOpen } from '$lib/stores/mira.js';
	import { tutorialOpen } from '$lib/stores/os.js';
	import { fade } from 'svelte/transition';

	import Wallpaper from '../../components/os/Wallpaper.svelte';
	import TopBar from '../../components/os/TopBar.svelte';
	import Desktop from '../../components/os/Desktop.svelte';
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
	let showBanner = true;

	onMount(() => {
		checkMonthlyRefill();
		if (!storage.storage.isOnboardingComplete()) {
			showLangPicker = true;
		}
		setTimeout(() => { showBanner = false; }, 3000);
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
	<Desktop />
	<div class="window-area">
		<WindowManager />
	</div>
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

{#if showBanner}
	<div class="welcome-banner" transition:fade={{ duration: 400 }}>
		<div class="wb-content">
			<span class="wb-logo">◈</span>
			<span class="wb-text">Bienvenido a MolvicOS</span>
		</div>
	</div>
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

	.window-area {
		position: absolute;
		top: 36px;
		left: 0;
		right: 0;
		bottom: 0;
		overflow: visible;
		z-index: 50;
		pointer-events: none;
	}

	.welcome-banner {
		position: fixed;
		inset: 0;
		z-index: 99999;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.85);
		backdrop-filter: blur(12px);
		pointer-events: none;
	}
	.wb-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}
	.wb-logo {
		font-size: 48px;
		color: var(--accent, #00ff88);
		animation: wb-pulse 1.5s ease-in-out infinite;
	}
	.wb-text {
		font-family: var(--font-display, 'Syne', sans-serif);
		font-size: 24px;
		color: #fff;
		letter-spacing: 2px;
		text-transform: uppercase;
	}
	@keyframes wb-pulse {
		0%, 100% { opacity: 0.6; transform: scale(1); }
		50% { opacity: 1; transform: scale(1.1); }
	}
</style>
