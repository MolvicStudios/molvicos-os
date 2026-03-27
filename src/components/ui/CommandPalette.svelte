<script>
	import { onMount, onDestroy } from 'svelte';
	import { cmdPaletteOpen, openApp } from '$lib/stores/os.js';
	import { theme } from '$lib/stores/os.js';
	import { setLang, t, SUPPORTED_LANGS } from '$lib/i18n/index.js';
	import { APPS } from '$lib/apps.js';
	import { trackAction, Actions } from '$lib/feedback/tracker.js';

	let query = '';
	let selectedIndex = 0;
	let inputEl;

	$: results = buildResults(query);
	$: if ($cmdPaletteOpen && inputEl) {
		setTimeout(() => inputEl?.focus(), 50);
	}

	function buildResults(q) {
		const items = [];
		const lower = q.toLowerCase();

		// Apps
		for (const app of APPS) {
			const name = t(`apps.${app.id}.name`);
			const desc = t(`apps.${app.id}.desc`);
			if (!q || name.toLowerCase().includes(lower) || desc.toLowerCase().includes(lower)) {
				items.push({
					type: 'app',
					category: t('cmd.apps'),
					label: name,
					sublabel: desc,
					emoji: app.emoji,
					action: () => {
						openApp({ ...app, title: name });
						close();
					}
				});
			}
		}

		// Actions
		const actions = [
			{
				label: t('cmd.actionToggleTheme'),
				emoji: '🎨',
				action: () => {
					theme.update((t) => (t === 'noir' ? 'icaro' : 'noir'));
					close();
				}
			},
			...SUPPORTED_LANGS.map((lang) => ({
				label: t('cmd.actionSwitchLang').replace('{lang}', lang.native),
				emoji: lang.flag,
				action: () => {
					setLang(lang.code);
					close();
				}
			}))
		];

		for (const action of actions) {
			if (!q || action.label.toLowerCase().includes(lower)) {
				items.push({ type: 'action', category: t('cmd.actions'), ...action });
			}
		}

		return items;
	}

	function close() {
		cmdPaletteOpen.set(false);
		query = '';
		selectedIndex = 0;
	}

	function handleKeyDown(e) {
		if (e.key === 'Escape') {
			close();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(results.length - 1, selectedIndex + 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(0, selectedIndex - 1);
		} else if (e.key === 'Enter' && results[selectedIndex]) {
			results[selectedIndex].action();
		}
	}

	function handleGlobalKeyDown(e) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			cmdPaletteOpen.update((v) => {
				if (!v) trackAction(Actions.CMD_PALETTE);
				return !v;
			});
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleGlobalKeyDown);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleGlobalKeyDown);
	});
</script>

{#if $cmdPaletteOpen}
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="cmd-overlay" on:click={close} on:keydown={handleKeyDown}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="cmd-dialog" on:click|stopPropagation>
			<input
				bind:this={inputEl}
				bind:value={query}
				class="cmd-input"
				placeholder={t('cmd.placeholder')}
				on:keydown={handleKeyDown}
			/>
			<div class="cmd-results">
				{#if results.length === 0}
					<div class="cmd-empty">{t('cmd.noResults')}</div>
				{:else}
					{#each results as result, i (result.label + i)}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<div
							class="cmd-result"
							class:selected={i === selectedIndex}
							on:click={result.action}
							on:mouseenter={() => (selectedIndex = i)}
						>
							<span class="cmd-emoji">{result.emoji}</span>
							<div class="cmd-result-text">
								<span class="cmd-result-label">{result.label}</span>
								{#if result.sublabel}
									<span class="cmd-result-sub">{result.sublabel}</span>
								{/if}
							</div>
							<span class="cmd-category">{result.category}</span>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.cmd-overlay {
		position: fixed;
		inset: 0;
		z-index: 10000;
		background: #00000070;
		backdrop-filter: blur(8px);
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 20vh;
		animation: fadeIn 0.15s ease;
	}

	.cmd-dialog {
		width: 500px;
		max-height: 400px;
		background: var(--bg-surface);
		border: 1px solid var(--border-accent);
		border-radius: var(--radius-lg);
		box-shadow: 0 20px 60px #00000080;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.cmd-input {
		width: 100%;
		height: 56px;
		padding: 0 20px;
		background: var(--bg-input);
		border: none;
		border-bottom: 1px solid var(--border-accent);
		border-radius: 0;
		font-family: var(--font-mono);
		font-size: 15px;
		color: var(--text-primary);
		outline: none;
	}

	.cmd-results {
		overflow-y: auto;
		max-height: 340px;
		padding: 4px 0;
	}

	.cmd-empty {
		padding: 20px;
		text-align: center;
		color: var(--text-muted);
		font-size: 13px;
	}

	.cmd-result {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 16px;
		cursor: pointer;
		transition: background var(--transition);
	}

	.cmd-result.selected {
		background: var(--accent-dim);
	}

	.cmd-emoji {
		font-size: 18px;
		line-height: 1;
		flex-shrink: 0;
	}

	.cmd-result-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.cmd-result-label {
		font-size: 13px;
		color: var(--text-primary);
	}

	.cmd-result-sub {
		font-size: 11px;
		color: var(--text-secondary);
	}

	.cmd-category {
		font-size: 9px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 1px;
		flex-shrink: 0;
	}
</style>
