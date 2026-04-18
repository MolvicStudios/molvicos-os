<script>
	import { createEventDispatcher } from 'svelte';

	export let history;
	export let renderItem;

	const dispatch = createEventDispatcher();

	$: items = $history;
</script>

<div class="history-sidebar">
	<div class="history-header">
		<span>History</span>
		<button on:click={history.clear}>Clear all</button>
	</div>

	{#if items.length === 0}
		<p class="history-empty">No history yet</p>
	{:else}
		{#each items as item (item.id)}
			{@const rendered = renderItem(item)}
			<button class="history-item" on:click={() => dispatch('select', item)}>
				<span class="hi-icon">{rendered.icon}</span>
				<div class="hi-text">
					<span class="hi-title">{rendered.title}</span>
					<span class="hi-sub">{rendered.subtitle}</span>
				</div>
				<button class="hi-del" on:click|stopPropagation={() => history.remove(item.id)}>×</button>
			</button>
		{/each}
	{/if}
</div>

<style>
	.history-sidebar {
		width: 220px;
		flex-shrink: 0;
		border-left: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.history-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		font-size: 11px;
		color: var(--text-secondary);
		border-bottom: 1px solid var(--border);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	.history-header button {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		font-size: 10px;
		font-family: var(--font-mono);
	}
	.history-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		border-bottom: 1px solid var(--border);
		cursor: pointer;
		transition: background var(--transition);
		font-family: var(--font-mono);
	}
	.history-item:hover {
		background: var(--bg-elevated);
	}
	.hi-icon {
		font-size: 14px;
		flex-shrink: 0;
	}
	.hi-text {
		flex: 1;
		overflow: hidden;
	}
	.hi-title {
		display: block;
		font-size: 11px;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.hi-sub {
		display: block;
		font-size: 10px;
		color: var(--text-secondary);
	}
	.hi-del {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		font-size: 14px;
		padding: 0 4px;
	}
	.hi-del:hover {
		color: var(--danger, #ff4444);
	}
	.history-empty {
		padding: 20px 12px;
		font-size: 11px;
		color: var(--text-muted);
		text-align: center;
	}
</style>
