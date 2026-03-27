<script>
	import { openWindows } from '$lib/stores/os.js';
	import Window from './Window.svelte';
</script>

{#each $openWindows as win (win.id)}
	<Window
		id={win.id}
		title={win.title}
		icon={win.icon}
		component={win.component}
		width={win.width}
		height={win.height}
		x={win.x}
		y={win.y}
		credits={win.credits}
		minimized={win.minimized}
		maximized={win.maximized}
		colorClass={win.colorClass}
	/>
{/each}
