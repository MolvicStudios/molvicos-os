<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	function isMobileDevice() {
		if (typeof window === 'undefined') return false;
		const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent
		);
		const smallScreen = window.innerWidth < 768;
		const hasTouch = 'ontouchstart' in window;
		return mobileUA || (smallScreen && hasTouch);
	}

	onMount(() => {
		if (isMobileDevice()) {
			goto('/mobile', { replaceState: true });
		}
	});
</script>

<slot />
