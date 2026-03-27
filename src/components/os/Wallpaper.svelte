<script>
	import { theme } from '$lib/stores/os.js';
</script>

<div class="wallpaper" class:icaro={$theme === 'icaro'}>
	<div class="grid"></div>
	<div class="scanlines"></div>
</div>

<style>
	.wallpaper {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		overflow: hidden;
		background: var(--bg-base);
	}

	.grid {
		position: absolute;
		inset: 0;
		background:
			repeating-linear-gradient(
				0deg,
				var(--accent-border) 0px,
				transparent 1px,
				transparent 60px
			),
			repeating-linear-gradient(
				90deg,
				var(--accent-border) 0px,
				transparent 1px,
				transparent 60px
			);
		opacity: 0.4;
		animation: gridDrift 20s linear infinite;
	}

	.scanlines {
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(
			0deg,
			transparent 0px,
			transparent 2px,
			rgba(0, 0, 0, 0.15) 2px,
			rgba(0, 0, 0, 0.15) 4px
		);
		animation: scanline 3s infinite;
	}

	.icaro .grid {
		background:
			repeating-linear-gradient(
				0deg,
				var(--accent-border) 0px,
				transparent 1px,
				transparent 80px
			),
			repeating-linear-gradient(
				90deg,
				var(--accent-border) 0px,
				transparent 1px,
				transparent 80px
			);
		opacity: 0.2;
	}

	.icaro .scanlines {
		display: none;
	}

	.icaro {
		background: linear-gradient(135deg, #f5f0e8, #ede4d4, #f5f0e8);
	}

	@keyframes gridDrift {
		from {
			transform: translate(0, 0);
		}
		to {
			transform: translate(60px, 60px);
		}
	}
</style>
