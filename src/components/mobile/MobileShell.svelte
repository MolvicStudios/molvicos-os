<script>
	import MobileTopBar from './MobileTopBar.svelte';
	import MobileBottomNav from './MobileBottomNav.svelte';
	import MobileHome from './MobileHome.svelte';
	import MobileAppView from './MobileAppView.svelte';
	import MiraButton from '../mira/MiraButton.svelte';
	import MiraPanel from '../mira/MiraPanel.svelte';
	import Notification from '../ui/Notification.svelte';
	import FeedbackModal from '../feedback/FeedbackModal.svelte';
	import FeedbackToast from '../feedback/FeedbackToast.svelte';
	import { mobileActiveApp, mobileAppComponent } from '$lib/stores/mobile.js';

	async function openApp(appDef) {
		const mod = await appDef.loader();
		mobileAppComponent.set(mod.default);
		mobileActiveApp.set(appDef);
	}

	function closeApp() {
		mobileActiveApp.set(null);
		mobileAppComponent.set(null);
	}
</script>

<div class="m-shell">
	<MobileTopBar activeApp={$mobileActiveApp} on:back={closeApp} />

	<main class="m-content">
		{#if $mobileActiveApp && $mobileAppComponent}
			<MobileAppView component={$mobileAppComponent} on:close={closeApp} />
		{:else}
			<MobileHome on:open={(e) => openApp(e.detail)} />
		{/if}
	</main>

	<MobileBottomNav
		activeApp={$mobileActiveApp}
		on:home={closeApp}
		on:open={(e) => openApp(e.detail)}
	/>
</div>

<MiraButton />
<MiraPanel />
<Notification />
<FeedbackModal />
<FeedbackToast />

<style>
	.m-shell {
		position: fixed;
		inset: 0;
		display: flex;
		flex-direction: column;
		background: var(--bg-base);
		overflow: hidden;
	}

	.m-content {
		flex: 1;
		min-height: 0;
		overflow: hidden;
		position: relative;
	}
</style>
