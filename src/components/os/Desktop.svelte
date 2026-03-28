<script>
	import AppIcon from './AppIcon.svelte';
	import { openApp } from '$lib/stores/os.js';
	import { getCoreApps, getPowerApps } from '$lib/apps.js';
	import { t } from '$lib/i18n/index.js';

	const coreApps = getCoreApps();
	const powerApps = getPowerApps();

	function handleOpen(e, app) {
		openApp({ ...app, title: $t(`apps.${app.id}.name`) });
	}
</script>

<div class="desktop">
	<div class="desktop-section">
		{#each coreApps as app (app.id)}
			<AppIcon
				id={app.id}
				label={$t(`apps.${app.id}.name`)}
				sublabel={$t(`apps.${app.id}.desc`)}
				emoji={app.emoji}
				colorClass={app.colorClass}
				badge={app.badge || ''}
				status={app.status}
				on:open={() => handleOpen(null, app)}
			/>
		{/each}
	</div>
	<div class="desktop-section">
		{#each powerApps as app (app.id)}
			<AppIcon
				id={app.id}
				label={$t(`apps.${app.id}.name`)}
				sublabel={$t(`apps.${app.id}.desc`)}
				emoji={app.emoji}
				colorClass={app.colorClass}
				badge={app.badge || ''}
				status={app.status}
				on:open={() => handleOpen(null, app)}
			/>
		{/each}
	</div>
</div>

<style>
	.desktop {
		position: fixed;
		top: 44px;
		left: 16px;
		bottom: 70px;
		display: flex;
		flex-direction: column;
		gap: 24px;
		padding: 16px 0;
		z-index: 1;
		overflow-y: auto;
		scrollbar-width: none;
	}

	.desktop::-webkit-scrollbar { display: none; }

	.desktop-section {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 16px;
	}

	@media (max-width: 640px) {
		.desktop {
			left: 8px;
			right: 8px;
			gap: 16px;
		}
		.desktop-section {
			grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
			gap: 10px;
		}
	}
</style>
