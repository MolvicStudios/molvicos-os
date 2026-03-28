<script>
	import AppIcon from './AppIcon.svelte';
	import { openApp } from '$lib/stores/os.js';
	import { getCoreApps, getPowerApps, getToolsApps } from '$lib/apps.js';
	import { t } from '$lib/i18n/index.js';
	import { onMount } from 'svelte';

	let coreApps = getCoreApps();
	let powerApps = getPowerApps();
	let toolsApps = getToolsApps();

	// Drag & drop state
	let dragSection = null;
	let dragIdx = null;

	onMount(() => {
		const saved = localStorage.getItem('ms_desktop_order');
		if (saved) {
			try {
				const order = JSON.parse(saved);
				if (order.core) coreApps = reorder(getCoreApps(), order.core);
				if (order.power) powerApps = reorder(getPowerApps(), order.power);
				if (order.tools) toolsApps = reorder(getToolsApps(), order.tools);
			} catch {}
		}
	});

	function reorder(apps, ids) {
		const map = Object.fromEntries(apps.map(a => [a.id, a]));
		const ordered = ids.filter(id => map[id]).map(id => map[id]);
		const remaining = apps.filter(a => !ids.includes(a.id));
		return [...ordered, ...remaining];
	}

	function saveOrder() {
		localStorage.setItem('ms_desktop_order', JSON.stringify({
			core: coreApps.map(a => a.id),
			power: powerApps.map(a => a.id),
			tools: toolsApps.map(a => a.id)
		}));
	}

	function getList(section) {
		if (section === 'core') return coreApps;
		if (section === 'power') return powerApps;
		return toolsApps;
	}

	function setList(section, list) {
		if (section === 'core') coreApps = list;
		else if (section === 'power') powerApps = list;
		else toolsApps = list;
	}

	function handleDragStart(section, idx) {
		dragSection = section;
		dragIdx = idx;
	}

	function handleDragOver(e) {
		e.preventDefault();
	}

	function handleDrop(section, targetIdx) {
		if (dragSection !== section || dragIdx === null || dragIdx === targetIdx) {
			dragSection = null;
			dragIdx = null;
			return;
		}
		const list = [...getList(section)];
		const [item] = list.splice(dragIdx, 1);
		list.splice(targetIdx, 0, item);
		setList(section, list);
		saveOrder();
		dragSection = null;
		dragIdx = null;
	}

	function handleDragEnd() {
		dragSection = null;
		dragIdx = null;
	}

	async function handleOpen(e, app) {
		await openApp({ ...app, title: $t(`apps.${app.id}.name`) });
	}
</script>

<div class="desktop">
	<div class="desktop-section">
		{#each coreApps as app, i (app.id)}
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="drag-wrap"
				class:dragging={dragSection === 'core' && dragIdx === i}
				draggable="true"
				on:dragstart={() => handleDragStart('core', i)}
				on:dragover={handleDragOver}
				on:drop={() => handleDrop('core', i)}
				on:dragend={handleDragEnd}
			>
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
			</div>
		{/each}
	</div>
	<div class="desktop-section">
		{#each powerApps as app, i (app.id)}
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="drag-wrap"
				class:dragging={dragSection === 'power' && dragIdx === i}
				draggable="true"
				on:dragstart={() => handleDragStart('power', i)}
				on:dragover={handleDragOver}
				on:drop={() => handleDrop('power', i)}
				on:dragend={handleDragEnd}
			>
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
			</div>
		{/each}
	</div>
	<div class="desktop-section">
		{#each toolsApps as app, i (app.id)}
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="drag-wrap"
				class:dragging={dragSection === 'tools' && dragIdx === i}
				draggable="true"
				on:dragstart={() => handleDragStart('tools', i)}
				on:dragover={handleDragOver}
				on:drop={() => handleDrop('tools', i)}
				on:dragend={handleDragEnd}
			>
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
			</div>
		{/each}
	</div>
</div>

<style>
	.desktop {
		position: fixed;
		top: 44px;
		left: 16px;
		right: 16px;
		bottom: 70px;
		display: flex;
		flex-direction: column;
		gap: 24px;
		padding: 16px 0;
		z-index: 1;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}

	.desktop::-webkit-scrollbar { display: none; }

	.desktop-section {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 16px;
	}

	.drag-wrap { transition: opacity 0.15s; cursor: grab; }
	.drag-wrap.dragging { opacity: 0.3; }
	.drag-wrap:active { cursor: grabbing; }

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
