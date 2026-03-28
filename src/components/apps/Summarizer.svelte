<script>
	import { t } from '$lib/i18n/index.js';
	import { streamAI } from '$lib/ai/stream.js';

	let texto = '';
	let longitud = 'medio';
	let resultado = '';
	let generando = false;

	const LONGITUDES = [
		{ id: 'breve', label: '⚡ Brief', desc: 'Max 3 sentences' },
		{ id: 'medio', label: '📄 Medium', desc: '1 paragraph' },
		{ id: 'detallado', label: '📖 Detailed', desc: '3 paragraphs + bullets' }
	];

	const INSTRUCCIONES = {
		breve: 'Summarize in a maximum of 3 concise sentences. Be extremely brief.',
		medio: 'Summarize in one clear paragraph. Capture all key points.',
		detallado: 'Provide a detailed summary in 3 paragraphs. Include bullet points for the key takeaways.'
	};

	async function generar() {
		if (!texto.trim() || generando) return;
		generando = true;
		resultado = '';

		const system = `You are an expert text summarizer. Respond in the user's language.
${INSTRUCCIONES[longitud]}
Only return the summary, no explanations or preamble.`;

		await streamAI({
			system,
			messages: [{ role: 'user', content: `Summarize this text:\n\n${texto}` }],
			temperature: 0.4,
			action: 'summarizer_generate',
			onChunk: (_, full) => resultado = full,
			onDone: () => generando = false,
			onError: (err) => { resultado = `Error: ${err}`; generando = false; }
		});
	}

	function copiar() { navigator.clipboard.writeText(resultado); }
	$: wordCount = texto.trim() ? texto.trim().split(/\s+/).length : 0;
</script>

<div class="sum-wrap">
	<div class="sum-left">
		<div class="sum-header">
			<span class="sum-label">📥 {$t('apps.summarizer.input') || 'Source text'}</span>
			<span class="sum-wc">{wordCount} words · {texto.length}/12000</span>
		</div>
		<textarea class="sum-input" bind:value={texto} placeholder="Paste the text you want to summarize..." maxlength="12000"></textarea>
		<div class="sum-controls">
			<div class="sum-lengths">
				{#each LONGITUDES as l}
					<button class="sum-len" class:active={longitud === l.id} on:click={() => longitud = l.id}>
						<span class="sl-label">{l.label}</span>
						<span class="sl-desc">{l.desc}</span>
					</button>
				{/each}
			</div>
			<button class="sum-gen" on:click={generar} disabled={generando || !texto.trim()}>
				{generando ? '⏳...' : '✂️ Summarize'}
			</button>
		</div>
	</div>

	<div class="sum-right">
		{#if resultado}
			<div class="sum-out-header">
				<span class="sum-badge">Summary ({longitud})</span>
				<button class="sum-copy" on:click={copiar}>📋 Copy</button>
			</div>
			<pre class="sum-text">{resultado}</pre>
		{:else}
			<div class="sum-empty">
				<span>✂️</span>
				<p>Paste text and choose summary length</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.sum-wrap { display: flex; height: 100%; font-family: var(--font-mono); gap: 1px; background: var(--border); }
	.sum-left { flex: 1; background: var(--bg-surface); display: flex; flex-direction: column; padding: 12px; gap: 8px; }
	.sum-right { flex: 1; background: var(--bg-base); padding: 16px; overflow-y: auto; }
	.sum-header { display: flex; justify-content: space-between; align-items: center; }
	.sum-label { font-size: 11px; color: var(--text-primary); }
	.sum-wc { font-size: 9px; color: var(--text-muted); }
	.sum-input {
		flex: 1; padding: 10px; font-size: 11px; background: var(--bg-input, var(--bg-base));
		border: 1px solid var(--border); border-radius: var(--radius-sm);
		color: var(--text-primary); font-family: var(--font-mono); outline: none; resize: none; line-height: 1.6;
	}
	.sum-input:focus { border-color: var(--accent); }
	.sum-controls { display: flex; flex-direction: column; gap: 8px; }
	.sum-lengths { display: flex; gap: 6px; }
	.sum-len {
		flex: 1; padding: 6px; border: 1px solid var(--border); border-radius: var(--radius-sm);
		background: none; cursor: pointer; display: flex; flex-direction: column; gap: 2px; align-items: center;
	}
	.sum-len.active { border-color: var(--accent); background: var(--accent-dim); }
	.sl-label { font-size: 10px; color: var(--text-primary); font-family: var(--font-mono); }
	.sl-desc { font-size: 8px; color: var(--text-muted); font-family: var(--font-mono); }
	.sum-gen {
		padding: 10px; font-size: 12px; background: var(--accent-dim); border: 1px solid var(--accent-border);
		color: var(--accent); border-radius: var(--radius-sm); cursor: pointer; font-family: var(--font-mono);
	}
	.sum-gen:disabled { opacity: 0.4; cursor: not-allowed; }
	.sum-out-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
	.sum-badge { font-size: 10px; color: var(--accent); letter-spacing: 1px; text-transform: uppercase; }
	.sum-copy {
		font-size: 10px; padding: 3px 8px; background: none; border: 1px solid var(--border);
		border-radius: var(--radius-sm); cursor: pointer; color: var(--text-secondary); font-family: var(--font-mono);
	}
	.sum-copy:hover { border-color: var(--accent); color: var(--accent); }
	.sum-text { font-size: 12px; color: var(--text-primary); white-space: pre-wrap; line-height: 1.7; margin: 0; }
	.sum-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 10px; color: var(--text-muted); }
	.sum-empty span { font-size: 36px; opacity: 0.3; }
	.sum-empty p { font-size: 12px; }
	@media (max-width: 640px) {
		.sum-wrap { flex-direction: column; }
		.sum-left, .sum-right { flex: none; height: 50%; }
	}
</style>
