<script>
	import { notifications } from '$lib/stores/os.js';
</script>

{#if $notifications.length > 0}
	<div class="notification-stack">
		{#each $notifications as notif (notif.id)}
			<div class="notification notification-{notif.type}">
				<span class="notif-message">{notif.message}</span>
			</div>
		{/each}
	</div>
{/if}

<style>
	.notification-stack {
		position: fixed;
		top: 44px;
		right: 12px;
		z-index: 9500;
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-width: 320px;
	}

	.notification {
		padding: 10px 16px;
		border-radius: var(--radius-sm);
		background: var(--bg-elevated);
		border: 1px solid var(--border-accent);
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-primary);
		animation: slideUp 0.2s ease;
		box-shadow: 0 4px 20px #00000040;
	}

	.notification-success {
		border-color: var(--success);
	}
	.notification-error {
		border-color: var(--danger);
	}
	.notification-warning {
		border-color: var(--warning);
	}
	.notification-info {
		border-color: var(--info);
	}

	.notif-message {
		line-height: 1.4;
	}
</style>
