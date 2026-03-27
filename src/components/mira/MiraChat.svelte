<script>
	import { miraMessages } from '$lib/stores/mira.js';
	import MiraMessage from './MiraMessage.svelte';
	import MiraToolResult from './MiraToolResult.svelte';
	import { afterUpdate } from 'svelte';

	let chatEl;

	afterUpdate(() => {
		if (chatEl) {
			chatEl.scrollTop = chatEl.scrollHeight;
		}
	});

	$: messages = $miraMessages;
</script>

<div class="mira-chat" bind:this={chatEl}>
	{#if messages.length === 0}
		<div class="mira-empty">
			<span class="empty-icon">✦</span>
			<p>Ask me anything or click a suggestion to get started.</p>
		</div>
	{:else}
		{#each messages as msg (msg.id)}
			{#if msg.role === 'tool'}
				<MiraToolResult {msg} />
			{:else}
				<MiraMessage {msg} />
			{/if}
		{/each}
	{/if}
</div>

<style>
	.mira-chat {
		flex: 1;
		overflow-y: auto;
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		scroll-behavior: smooth;
	}

	.mira-chat::-webkit-scrollbar {
		width: 4px;
	}
	.mira-chat::-webkit-scrollbar-track {
		background: transparent;
	}
	.mira-chat::-webkit-scrollbar-thumb {
		background: var(--border);
		border-radius: 2px;
	}

	.mira-empty {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		color: var(--text-muted);
	}

	.empty-icon {
		font-size: 36px;
		color: var(--accent);
		opacity: 0.4;
	}

	.mira-empty p {
		font-family: var(--font-mono);
		font-size: 12px;
		text-align: center;
		line-height: 1.5;
		max-width: 240px;
	}
</style>
