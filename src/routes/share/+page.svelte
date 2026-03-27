<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let content = '';
	let source = '';
	let error = false;

	onMount(() => {
		try {
			const params = $page.url.searchParams;
			const data = params.get('d');
			source = params.get('s') || 'molvicos';
			if (data) {
				content = decodeURIComponent(atob(data));
			} else {
				error = true;
			}
		} catch {
			error = true;
		}
	});

	function copyAll() {
		navigator.clipboard.writeText(content);
	}
</script>

<svelte:head>
	<title>Shared Content — Molvicos.pro</title>
</svelte:head>

<div class="share-page">
	<header class="share-header">
		<span class="share-logo">▲ molvicos.pro</span>
		<span class="share-badge">Shared from {source}</span>
	</header>

	{#if error}
		<div class="share-error">
			<p>Invalid or expired share link.</p>
			<a href="/">Go to Molvicos</a>
		</div>
	{:else}
		<div class="share-content">
			<div class="share-toolbar">
				<button class="copy-btn" on:click={copyAll}>Copy content</button>
			</div>
			<pre class="share-text">{content}</pre>
		</div>
	{/if}

	<footer class="share-footer">
		<a href="/">Create your own with Molvicos.pro →</a>
	</footer>
</div>

<style>
	.share-page {
		min-height: 100vh; background: #0d0d0d; color: #e0e0e0;
		font-family: 'Space Mono', monospace; display: flex; flex-direction: column;
	}
	.share-header {
		display: flex; justify-content: space-between; align-items: center;
		padding: 16px 24px; border-bottom: 1px solid #222;
	}
	.share-logo { font-weight: 700; font-size: 14px; }
	.share-badge { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; }

	.share-content { flex: 1; padding: 24px; max-width: 800px; margin: 0 auto; width: 100%; }
	.share-toolbar { display: flex; justify-content: flex-end; margin-bottom: 12px; }
	.copy-btn {
		font-family: inherit; font-size: 11px; padding: 6px 14px;
		background: #1a1a1a; border: 1px solid #333; border-radius: 4px;
		color: #aaa; cursor: pointer;
	}
	.copy-btn:hover { border-color: #00e5ff; color: #00e5ff; }

	.share-text {
		font-size: 12px; line-height: 1.7; white-space: pre-wrap; word-break: break-word;
		background: #111; border: 1px solid #222; border-radius: 6px; padding: 20px;
		margin: 0;
	}

	.share-error { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
	.share-error a { color: #00e5ff; font-size: 12px; }

	.share-footer { padding: 16px 24px; text-align: center; border-top: 1px solid #222; }
	.share-footer a { color: #00e5ff; font-size: 11px; text-decoration: none; }
	.share-footer a:hover { text-decoration: underline; }
</style>
