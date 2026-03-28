<script>
	import { t } from '$lib/i18n/index.js';
	import { streamAI } from '$lib/ai/stream.js';

	let proyecto = '';
	let contextoExtra = '';
	let resultado = '';
	let generando = false;

	async function generar() {
		if (!proyecto.trim() || generando) return;
		generando = true;
		resultado = '';

		const system = `You are a strategic analyst expert in SWOT/DAFO analysis. Write in the user's language.
Generate a complete SWOT analysis with 4 sections:
- Strengths (4-6 bullet points)
- Weaknesses (4-6 bullet points)  
- Opportunities (4-6 bullet points)
- Threats (4-6 bullet points)

End with a strategic recommendation paragraph.
Use markdown formatting with ## headers and bullet points.`;

		const userMsg = `Project/Business: ${proyecto}${contextoExtra ? `\nAdditional context: ${contextoExtra}` : ''}

Generate the complete SWOT analysis.`;

		await streamAI({
			system,
			messages: [{ role: 'user', content: userMsg }],
			temperature: 0.6,
			action: 'dafo_generate',
			onChunk: (_, full) => resultado = full,
			onDone: () => generando = false,
			onError: (err) => { resultado = `Error: ${err}`; generando = false; }
		});
	}

	function copiar() { navigator.clipboard.writeText(resultado); }
</script>

<div class="dafo-wrap">
	<div class="dafo-form">
		<div class="dafo-field">
			<label>📋 {$t('apps.dafo.project') || 'Project / Business'}</label>
			<input type="text" bind:value={proyecto} placeholder="e.g. Freelance web agency" maxlength="200" />
		</div>
		<div class="dafo-field">
			<label>📝 {$t('apps.dafo.context') || 'Additional context'} <span class="opt">(optional)</span></label>
			<textarea bind:value={contextoExtra} placeholder="Market, competitors, team size..." rows="3" maxlength="500"></textarea>
		</div>
		<button class="dafo-gen" on:click={generar} disabled={generando || !proyecto.trim()}>
			{generando ? '⏳ Analyzing...' : '📊 Generate SWOT'}
		</button>
	</div>

	<div class="dafo-output">
		{#if resultado}
			<div class="dafo-toolbar">
				<span class="dafo-badge">SWOT Analysis</span>
				<button class="dafo-copy" on:click={copiar}>📋 Copy</button>
			</div>
			<div class="dafo-text">{@html resultado.replace(/^## (.+)$/gm, '<h3 class="dafo-h">$1</h3>').replace(/^- (.+)$/gm, '<div class="dafo-bullet">• $1</div>').replace(/\n\n/g, '<br/>')}</div>
		{:else}
			<div class="dafo-empty">
				<span>📊</span>
				<p>Describe your project to generate a SWOT analysis</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.dafo-wrap { display: flex; height: 100%; font-family: var(--font-mono); gap: 1px; background: var(--border); }
	.dafo-form { width: 300px; flex-shrink: 0; background: var(--bg-surface); padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
	.dafo-output { flex: 1; background: var(--bg-base); padding: 16px; overflow-y: auto; }
	.dafo-field { display: flex; flex-direction: column; gap: 4px; }
	.dafo-field label { font-size: 11px; color: var(--text-primary); }
	.opt { color: var(--text-muted); font-size: 9px; }
	.dafo-field input, .dafo-field textarea {
		padding: 8px; font-size: 11px; background: var(--bg-input, var(--bg-base));
		border: 1px solid var(--border); border-radius: var(--radius-sm);
		color: var(--text-primary); font-family: var(--font-mono); outline: none; resize: none;
	}
	.dafo-field input:focus, .dafo-field textarea:focus { border-color: var(--accent); }
	.dafo-gen {
		padding: 10px; font-size: 12px; background: var(--accent-dim); border: 1px solid var(--accent-border);
		color: var(--accent); border-radius: var(--radius-sm); cursor: pointer; font-family: var(--font-mono);
	}
	.dafo-gen:disabled { opacity: 0.4; cursor: not-allowed; }
	.dafo-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
	.dafo-badge { font-size: 10px; color: var(--accent); letter-spacing: 1px; text-transform: uppercase; }
	.dafo-copy {
		font-size: 10px; padding: 3px 8px; background: none; border: 1px solid var(--border);
		border-radius: var(--radius-sm); cursor: pointer; color: var(--text-secondary); font-family: var(--font-mono);
	}
	.dafo-copy:hover { border-color: var(--accent); color: var(--accent); }
	.dafo-text { font-size: 12px; color: var(--text-primary); line-height: 1.6; }
	:global(.dafo-h) { font-size: 13px; color: var(--accent); margin: 14px 0 6px; font-family: var(--font-display); }
	:global(.dafo-bullet) { padding: 2px 0 2px 8px; font-size: 11px; }
	.dafo-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 10px; color: var(--text-muted); }
	.dafo-empty span { font-size: 36px; opacity: 0.3; }
	.dafo-empty p { font-size: 12px; }
	@media (max-width: 640px) {
		.dafo-wrap { flex-direction: column; }
		.dafo-form { width: 100%; max-height: 45%; }
	}
</style>
