<script>
	import { t } from '$lib/i18n/index.js';
	import { streamAI } from '$lib/ai/stream.js';

	let descripcion = '';
	let valores = '';
	let sector = 'tech';
	let estilo = 'inventado';
	let resultado = '';
	let nombres = [];
	let generando = false;

	const SECTORES = ['tech', 'fashion', 'food', 'health', 'finance', 'education', 'creative'];
	const ESTILOS = ['inventado', 'descriptivo', 'evocador', 'acronimo', 'metaforico'];

	async function generar() {
		if (!descripcion.trim() || generando) return;
		generando = true;
		resultado = '';
		nombres = [];

		const system = `You are an expert brand naming consultant. Respond in the user's language.
Generate exactly 5 brand name proposals. For each, return a JSON object with:
- nombre: the brand name
- concepto: one-line concept explanation
- historia: brand story (2-3 sentences)
- dominio_sugerido: suggested .com domain
- brandabilidad: score 1-5
- pronunciacion: phonetic guide

Return ONLY a valid JSON array of 5 objects. No markdown fences, no explanation.`;

		const userMsg = `Business description: ${descripcion}
Values: ${valores || 'Not specified'}
Sector: ${sector}
Naming style: ${estilo}

Generate 5 brand name proposals.`;

		await streamAI({
			system,
			messages: [{ role: 'user', content: userMsg }],
			temperature: 0.9,
			action: 'brandname_generate',
			onChunk: (_, full) => resultado = full,
			onDone: (full) => {
				generando = false;
				try {
					const clean = full.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
					const start = clean.indexOf('[');
					const end = clean.lastIndexOf(']') + 1;
					if (start >= 0 && end > start) {
						nombres = JSON.parse(clean.slice(start, end));
					}
				} catch { /* keep raw */ }
			},
			onError: (err) => { resultado = `Error: ${err}`; generando = false; }
		});
	}

	function copiar(text) { navigator.clipboard.writeText(text); }
</script>

<div class="bn-wrap">
	<div class="bn-form">
		<div class="bn-field">
			<label>💡 {$t('apps.brandname.description') || 'Business description'}</label>
			<textarea bind:value={descripcion} placeholder="What does your business do?" rows="3" maxlength="300"></textarea>
		</div>
		<div class="bn-field">
			<label>✨ {$t('apps.brandname.values') || 'Values / Keywords'}</label>
			<input type="text" bind:value={valores} placeholder="innovation, trust, speed..." />
		</div>
		<div class="bn-field">
			<label>🏷️ {$t('apps.brandname.sector') || 'Sector'}</label>
			<div class="bn-pills">
				{#each SECTORES as s}
					<button class="bn-pill" class:active={sector === s} on:click={() => sector = s}>{s}</button>
				{/each}
			</div>
		</div>
		<div class="bn-field">
			<label>🎨 {$t('apps.brandname.style') || 'Naming style'}</label>
			<div class="bn-pills">
				{#each ESTILOS as e}
					<button class="bn-pill" class:active={estilo === e} on:click={() => estilo = e}>{e}</button>
				{/each}
			</div>
		</div>
		<button class="bn-gen" on:click={generar} disabled={generando || !descripcion.trim()}>
			{generando ? '⏳ Generating...' : '🏷️ Generate Names'}
		</button>
	</div>

	<div class="bn-output">
		{#if nombres.length > 0}
			<div class="bn-grid">
				{#each nombres as n, i}
					<div class="bn-card">
						<div class="bn-card-head">
							<span class="bn-name">{n.nombre}</span>
							<span class="bn-stars">{'★'.repeat(n.brandabilidad || 3)}{'☆'.repeat(5 - (n.brandabilidad || 3))}</span>
						</div>
						<p class="bn-concept">{n.concepto}</p>
						<p class="bn-story">{n.historia}</p>
						<div class="bn-meta">
							<span class="bn-domain">{n.dominio_sugerido}</span>
							<span class="bn-pron">/{n.pronunciacion}/</span>
						</div>
						<button class="bn-copy" on:click={() => copiar(n.nombre)}>Copy</button>
					</div>
				{/each}
			</div>
		{:else if resultado && !generando}
			<pre class="bn-raw">{resultado}</pre>
		{:else}
			<div class="bn-empty">
				<span>🏷️</span>
				<p>Describe your business to generate brand names</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.bn-wrap { display: flex; height: 100%; font-family: var(--font-mono); gap: 1px; background: var(--border); }
	.bn-form { width: 300px; flex-shrink: 0; background: var(--bg-surface); padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
	.bn-output { flex: 1; background: var(--bg-base); padding: 16px; overflow-y: auto; }
	.bn-field { display: flex; flex-direction: column; gap: 4px; }
	.bn-field label { font-size: 11px; color: var(--text-primary); }
	.bn-field input, .bn-field textarea {
		padding: 8px; font-size: 11px; background: var(--bg-input, var(--bg-base));
		border: 1px solid var(--border); border-radius: var(--radius-sm);
		color: var(--text-primary); font-family: var(--font-mono); outline: none; resize: none;
	}
	.bn-field input:focus, .bn-field textarea:focus { border-color: var(--accent); }
	.bn-pills { display: flex; flex-wrap: wrap; gap: 4px; }
	.bn-pill {
		padding: 3px 8px; font-size: 9px; border: 1px solid var(--border);
		border-radius: var(--radius-sm); background: none; cursor: pointer;
		color: var(--text-secondary); font-family: var(--font-mono); text-transform: capitalize;
	}
	.bn-pill.active { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }
	.bn-gen {
		padding: 10px; font-size: 12px; background: var(--accent-dim); border: 1px solid var(--accent-border);
		color: var(--accent); border-radius: var(--radius-sm); cursor: pointer; font-family: var(--font-mono);
	}
	.bn-gen:disabled { opacity: 0.4; cursor: not-allowed; }
	.bn-grid { display: flex; flex-direction: column; gap: 10px; }
	.bn-card {
		padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-md);
		background: var(--bg-surface); display: flex; flex-direction: column; gap: 6px;
	}
	.bn-card-head { display: flex; justify-content: space-between; align-items: center; }
	.bn-name { font-size: 15px; font-family: var(--font-display); color: var(--accent); letter-spacing: 1px; }
	.bn-stars { font-size: 11px; color: var(--accent2, #ffaa00); }
	.bn-concept { font-size: 11px; color: var(--text-primary); margin: 0; }
	.bn-story { font-size: 10px; color: var(--text-secondary); margin: 0; line-height: 1.5; }
	.bn-meta { display: flex; justify-content: space-between; font-size: 9px; color: var(--text-muted); }
	.bn-domain { color: var(--accent2, #00ccff); }
	.bn-copy {
		align-self: flex-end; font-size: 9px; padding: 2px 8px;
		background: none; border: 1px solid var(--border); border-radius: var(--radius-sm);
		cursor: pointer; color: var(--text-secondary); font-family: var(--font-mono);
	}
	.bn-copy:hover { border-color: var(--accent); color: var(--accent); }
	.bn-raw { font-size: 11px; color: var(--text-primary); white-space: pre-wrap; margin: 0; }
	.bn-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 10px; color: var(--text-muted); }
	.bn-empty span { font-size: 36px; opacity: 0.3; }
	.bn-empty p { font-size: 12px; }
	@media (max-width: 640px) {
		.bn-wrap { flex-direction: column; }
		.bn-form { width: 100%; max-height: 50%; }
	}
</style>
