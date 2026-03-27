<script>
	import { miraSuggestions, miraOpen } from '$lib/stores/mira.js';
	import { sendMessage } from '$lib/mira/index.js';
	import { executeTool } from '$lib/mira/tools.js';
	import { openApp } from '$lib/stores/os.js';
	import { getApp } from '$lib/apps.js';

	$: suggestions = $miraSuggestions;

	function handleSuggestion(s) {
		if (!s.action) return;

		if (s.action === 'chat') {
			// Just focus input; the suggestion text provides context
			sendMessage(s.text);
			return;
		}

		const [tool, arg] = s.action.split(':');
		if (tool === 'open_app') {
			const app = getApp(arg);
			if (app) openApp(app);
		} else if (tool === 'change_theme') {
			executeTool('change_theme', { theme: arg });
		}
	}
</script>

{#if suggestions.length > 0}
	<div class="mira-suggestions">
		{#each suggestions as s (s.id)}
			<button class="suggestion-chip" on:click={() => handleSuggestion(s)}>
				{s.text}
			</button>
		{/each}
	</div>
{/if}

<style>
	.mira-suggestions {
		display: flex;
		gap: 6px;
		padding: 8px 12px;
		overflow-x: auto;
		flex-shrink: 0;
		border-bottom: 1px solid var(--border);
	}

	.mira-suggestions::-webkit-scrollbar {
		height: 2px;
	}
	.mira-suggestions::-webkit-scrollbar-thumb {
		background: var(--border);
		border-radius: 1px;
	}

	.suggestion-chip {
		flex-shrink: 0;
		padding: 5px 12px;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--accent);
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 14px;
		cursor: pointer;
		transition: all var(--transition);
		white-space: nowrap;
	}
	.suggestion-chip:hover {
		border-color: var(--accent);
		background: var(--bg-active);
	}
</style>
