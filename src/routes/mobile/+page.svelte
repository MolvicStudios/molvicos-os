<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fly, fade } from 'svelte/transition';
	import MobileShell from '../../components/mobile/MobileShell.svelte';
	import * as storageLib from '$lib/storage/local.js';
	import { detectLang, currentLang, setLang } from '$lib/i18n/index.js';

	let ready = false;
	let showOnboarding = false;

	const languages = [
		{ code: 'en', label: 'English', flag: '🇬🇧' },
		{ code: 'es', label: 'Español', flag: '🇪🇸' },
		{ code: 'de', label: 'Deutsch', flag: '🇩🇪' },
		{ code: 'fr', label: 'Français', flag: '🇫🇷' },
		{ code: 'zh', label: '中文', flag: '🇨🇳' }
	];

	onMount(() => {
		// Redirect true desktop users back to the full OS
		const isDesktop = window.innerWidth >= 1024 && !('ontouchstart' in window);
		if (isDesktop) {
			goto('/os', { replaceState: true });
			return;
		}

		detectLang();

		if (!storageLib.storage.isOnboardingComplete()) {
			showOnboarding = true;
		}

		ready = true;
	});

	function confirmLang() {
		storageLib.storage.setOnboardingComplete(true);
		showOnboarding = false;
	}
</script>

<svelte:head>
	<title>Molvicos OS</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
</svelte:head>

{#if ready}
	<div in:fade={{ duration: 180 }}>
		<MobileShell />

		<!-- Simplified mobile onboarding: language only -->
		{#if showOnboarding}
			<div class="ob-backdrop" in:fade={{ duration: 200 }}>
				<div class="ob-sheet" in:fly={{ y: 60, duration: 280 }}>
					<div class="ob-logo">◈ MOLVICOS</div>
					<h2 class="ob-title">Choose your language</h2>
					<p class="ob-sub">You can change this anytime in settings</p>

					<div class="ob-langs">
						{#each languages as lang}
							<button
								class="ob-lang-btn"
								class:active={$currentLang === lang.code}
								on:click={() => setLang(lang.code)}
							>
								<span class="ob-flag">{lang.flag}</span>
								<span class="ob-lang-label">{lang.label}</span>
								{#if $currentLang === lang.code}
									<span class="ob-check">✓</span>
								{/if}
							</button>
						{/each}
					</div>

					<button class="ob-confirm" on:click={confirmLang}>
						Continue →
					</button>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.ob-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(12px);
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	/* Bottom sheet style — feels native on mobile */
	.ob-sheet {
		background: var(--bg-surface);
		border-top: 1px solid var(--border-accent);
		border-radius: 20px 20px 0 0;
		padding: 28px 20px 36px;
		width: 100%;
		max-width: 480px;
		padding-bottom: max(36px, env(safe-area-inset-bottom, 36px));
	}

	.ob-logo {
		font-family: var(--font-display, 'Syne', sans-serif);
		font-size: 13px;
		font-weight: 700;
		color: var(--accent);
		letter-spacing: 3px;
		text-align: center;
		margin-bottom: 16px;
	}

	.ob-title {
		font-family: var(--font-display, 'Syne', sans-serif);
		font-size: 22px;
		font-weight: 700;
		color: var(--text-primary);
		text-align: center;
		margin: 0 0 6px;
	}

	.ob-sub {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-secondary);
		text-align: center;
		margin: 0 0 24px;
	}

	.ob-langs {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 24px;
	}

	.ob-lang-btn {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 13px 16px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition: all 0.15s ease;
		font-family: var(--font-mono);
		font-size: 14px;
		color: var(--text-primary);
		text-align: left;
		width: 100%;
	}

	.ob-lang-btn.active {
		border-color: var(--accent-border);
		background: var(--accent-dim);
	}

	.ob-flag {
		font-size: 20px;
		line-height: 1;
	}

	.ob-lang-label {
		flex: 1;
	}

	.ob-check {
		color: var(--accent);
		font-weight: 700;
	}

	.ob-confirm {
		width: 100%;
		height: 50px;
		background: var(--accent);
		color: #000;
		font-family: var(--font-display, 'Syne', sans-serif);
		font-size: 15px;
		font-weight: 700;
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		letter-spacing: 0.5px;
		transition: opacity 0.15s ease;
	}

	.ob-confirm:active {
		opacity: 0.8;
	}
</style>
