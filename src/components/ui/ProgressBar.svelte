<script>
	export let value = 0;
	export let max = 100;
	export let animated = false;

	$: pct = Math.min(100, Math.max(0, (value / max) * 100));
</script>

<div class="progress-bar">
	<div class="progress-fill" class:animated style="width: {pct}%"></div>
</div>

<style>
	.progress-bar {
		width: 100%;
		height: 4px;
		background: var(--bg-input);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--accent);
		border-radius: 2px;
		transition: width 0.3s ease;
	}

	.progress-fill.animated {
		animation: boot-bar 2s ease forwards;
	}
</style>
