<script>
	import { t } from '$lib/i18n/index.js';
	import { streamAI } from '$lib/ai/stream.js';

	let texto = '';
	let tono = 'formal';
	let resultado = '';
	let generando = false;

	const TONOS = [
		{ id: 'formal', emoji: '👔', label: 'Formal' },
		{ id: 'casual', emoji: '😊', label: 'Casual' },
		{ id: 'persuasivo', emoji: '🎯', label: 'Persuasive' },
		{ id: 'empatico', emoji: '💚', label: 'Empathic' },
		{ id: 'profesional', emoji: '💼', label: 'Professional' },
		{ id: 'divertido', emoji: '🎉', label: 'Fun' },
	];

	const INSTRUCCIONES = {
		formal: 'Rewrite in a formal, institutional tone. Use proper language, avoid contractions, maintain respectful distance.',
		casual: 'Rewrite in a casual, friendly tone. Use conversational language, contractions, natural flow.',
		persuasivo: 'Rewrite in a persuasive, compelling tone. Use power words, emotional triggers, clear call to action.',
		empatico: 'Rewrite in an empathetic, understanding tone. Show care, acknowledge feelings, be warm and supportive.',
		profesional: 'Rewrite in a professional business tone. Clear, concise, confident. Suitable for B2B communication.',
		divertido: 'Rewrite in a fun, entertaining tone. Use humor, energy, creative expressions. Keep it lighthearted.',
	};

	async function generar() {
		if (!texto.trim() || generando) return;
		generando = true;
		resultado = '';

		const system = `You are a communication expert specializing in tone adaptation. Respond in the user's language.
${INSTRUCCIONES[tono]}
Keep the original meaning intact. Only return the rewritten text.`;

		await streamAI({
			system,
			messages: [{ role: 'user', content: `Rewrite this text:\n\n${texto}` }],
			temperature: 0.6,
			action: 'toneshifter_generate',
			onChunk: (_, full) => resultado = full,
			onDone: () => generando = false,
			onError: (err) => { resultado = `Error: ${err}`; generando = false; }
		});
	}

	function copiar() { navigator.clipboard.writeText(resultado); }
</script>

<div class="ts-wrap">
	<div class="ts-left">
		<div class="ts-header">
			<span class="ts-label">📥 {$t('apps.toneshifter.input') || 'Original text'}</span>
			<span class="ts-count">{texto.length}/12000</span>
		</div>
		<textarea class="ts-input" bind:value={texto} placeholder="Paste the text you want to change tone..." maxlength="12000"></textarea>
	</div>

	<div class="ts-center">
		<div class="ts-tones">
			{#each TONOS as t}
				<button class="ts-tone" class:active={tono === t.id} on:click={() => tono = t.id}>
					<span class="tt-emoji">{t.emoji}</span>
					<span class="tt-label">{t.label}</span>
				</button>
			{/each}
		</div>
		<button class="ts-gen" on:click={generar} disabled={generando || !texto.trim()}>
			{generando ? '⏳' : '🔄'} {tono}
		</button>
	</div>

	<div class="ts-right">
		{#if resultado}
			<div class="ts-out-header">
				<span class="ts-badge">{TONOS.find(t => t.id === tono)?.emoji} {tono}</span>
				<button class="ts-copy" on:click={copiar}>📋 Copy</button>
			</div>
			<pre class="ts-text">{resultado}</pre>
		{:else}
			<div class="ts-empty">
				<span>🔄</span>
				<p>Paste text and select target tone</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.ts-wrap { display: flex; height: 100%; font-family: var(--font-mono); gap: 1px; background: var(--border); }
	.ts-left { flex: 1; background: var(--bg-surface); display: flex; flex-direction: column; padding: 12px; gap: 6px; }
	.ts-center { width: 100px; background: var(--bg-elevated); display: flex; flex-direction: column; align-items: center; padding: 10px 6px; gap: 6px; overflow-y: auto; }
	.ts-right { flex: 1; background: var(--bg-base); padding: 16px; overflow-y: auto; }
	.ts-header { display: flex; justify-content: space-between; align-items: center; }
	.ts-label { font-size: 11px; color: var(--text-primary); }
	.ts-count { font-size: 9px; color: var(--text-muted); }
	.ts-input {
		flex: 1; padding: 10px; font-size: 11px; background: var(--bg-input, var(--bg-base));
		border: 1px solid var(--border); border-radius: var(--radius-sm);
		color: var(--text-primary); font-family: var(--font-mono); outline: none; resize: none; line-height: 1.6;
	}
	.ts-input:focus { border-color: var(--accent); }
	.ts-tones { display: flex; flex-direction: column; gap: 4px; width: 100%; }
	.ts-tone {
		display: flex; align-items: center; gap: 4px; padding: 6px;
		border: 1px solid var(--border); border-radius: var(--radius-sm);
		background: none; cursor: pointer; width: 100%;
	}
	.ts-tone.active { border-color: var(--accent); background: var(--accent-dim); }
	.tt-emoji { font-size: 12px; }
	.tt-label { font-size: 8px; color: var(--text-secondary); font-family: var(--font-mono); }
	.ts-tone.active .tt-label { color: var(--accent); }
	.ts-gen {
		padding: 8px; font-size: 10px; background: var(--accent-dim); border: 1px solid var(--accent-border);
		color: var(--accent); border-radius: var(--radius-sm); cursor: pointer;
		font-family: var(--font-mono); width: 100%; text-transform: capitalize;
	}
	.ts-gen:disabled { opacity: 0.4; cursor: not-allowed; }
	.ts-out-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
	.ts-badge { font-size: 10px; color: var(--accent); text-transform: capitalize; }
	.ts-copy {
		font-size: 10px; padding: 3px 8px; background: none; border: 1px solid var(--border);
		border-radius: var(--radius-sm); cursor: pointer; color: var(--text-secondary); font-family: var(--font-mono);
	}
	.ts-copy:hover { border-color: var(--accent); color: var(--accent); }
	.ts-text { font-size: 12px; color: var(--text-primary); white-space: pre-wrap; line-height: 1.7; margin: 0; }
	.ts-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 10px; color: var(--text-muted); }
	.ts-empty span { font-size: 36px; opacity: 0.3; }
	.ts-empty p { font-size: 12px; }
	@media (max-width: 640px) {
		.ts-wrap { flex-direction: column; }
		.ts-left, .ts-right { flex: none; height: 40%; }
		.ts-center { width: 100%; flex-direction: row; height: auto; overflow-x: auto; }
		.ts-tones { flex-direction: row; }
		.ts-gen { width: auto; }
	}
</style>
