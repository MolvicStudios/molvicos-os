<script>
	import { t } from '$lib/i18n/index.js';
	import { streamAI } from '$lib/ai/stream.js';

	let destinatario = '';
	let contexto = '';
	let tono = 'formal';
	let resultado = '';
	let generando = false;

	const TONOS = ['formal', 'casual', 'persuasivo', 'directo', 'cordial'];

	async function generar() {
		if (!contexto.trim() || generando) return;
		generando = true;
		resultado = '';

		const system = `You are a professional email writer. Write in the user's language.
Generate a complete email with: Subject line, Greeting, Body, Closing.
Only return the email text, no explanations.`;

		const userMsg = `Recipient: ${destinatario || 'Not specified'}
Context: ${contexto}
Tone: ${tono}

Write the email.`;

		await streamAI({
			system,
			messages: [{ role: 'user', content: userMsg }],
			temperature: 0.7,
			action: 'mailcraft_generate',
			onChunk: (_, full) => resultado = full,
			onDone: () => generando = false,
			onError: (err) => { resultado = `Error: ${err}`; generando = false; }
		});
	}

	function copiar() {
		navigator.clipboard.writeText(resultado);
	}
</script>

<div class="mc-wrap">
	<div class="mc-form">
		<div class="mc-field">
			<label class="mc-label">📧 {$t('apps.mailcraft.recipient') || 'Recipient'}</label>
			<input type="text" bind:value={destinatario} placeholder="Name, role, company..." maxlength="120" />
		</div>

		<div class="mc-field">
			<label class="mc-label">📝 {$t('apps.mailcraft.context') || 'Context'}</label>
			<textarea bind:value={contexto} placeholder="What is this email about?" rows="4" maxlength="500"></textarea>
			<span class="mc-count">{contexto.length}/500</span>
		</div>

		<div class="mc-field">
			<label class="mc-label">🎨 {$t('apps.mailcraft.tone') || 'Tone'}</label>
			<div class="mc-pills">
				{#each TONOS as t}
					<button class="mc-pill" class:active={tono === t} on:click={() => tono = t}>{t}</button>
				{/each}
			</div>
		</div>

		<button class="mc-gen" on:click={generar} disabled={generando || !contexto.trim()}>
			{generando ? '⏳ Generating...' : '✉️ Generate Email'}
		</button>
	</div>

	<div class="mc-output">
		{#if resultado}
			<div class="mc-result">
				<div class="mc-toolbar">
					<span class="mc-badge">Generated Email</span>
					<button class="mc-copy" on:click={copiar}>📋 Copy</button>
				</div>
				<pre class="mc-text">{resultado}</pre>
			</div>
		{:else}
			<div class="mc-empty">
				<span class="mc-empty-icon">✉️</span>
				<p>Describe the context and generate your email</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.mc-wrap { display: flex; height: 100%; font-family: var(--font-mono); gap: 1px; background: var(--border); }
	.mc-form { width: 320px; flex-shrink: 0; background: var(--bg-surface); padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
	.mc-output { flex: 1; background: var(--bg-base); padding: 16px; overflow-y: auto; }
	.mc-field { display: flex; flex-direction: column; gap: 4px; }
	.mc-label { font-size: 11px; color: var(--text-primary); }
	.mc-field input, .mc-field textarea {
		padding: 8px; font-size: 11px; background: var(--bg-input, var(--bg-base));
		border: 1px solid var(--border); border-radius: var(--radius-sm);
		color: var(--text-primary); font-family: var(--font-mono); outline: none; resize: none;
	}
	.mc-field input:focus, .mc-field textarea:focus { border-color: var(--accent); }
	.mc-count { font-size: 9px; color: var(--text-muted); text-align: right; }
	.mc-pills { display: flex; flex-wrap: wrap; gap: 4px; }
	.mc-pill {
		padding: 4px 10px; font-size: 10px; border: 1px solid var(--border);
		border-radius: var(--radius-sm); background: none; cursor: pointer;
		color: var(--text-secondary); font-family: var(--font-mono); text-transform: capitalize;
	}
	.mc-pill.active { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }
	.mc-gen {
		padding: 10px; font-size: 12px; background: var(--accent-dim); border: 1px solid var(--accent-border);
		color: var(--accent); border-radius: var(--radius-sm); cursor: pointer; font-family: var(--font-mono);
	}
	.mc-gen:disabled { opacity: 0.4; cursor: not-allowed; }
	.mc-result { display: flex; flex-direction: column; gap: 8px; }
	.mc-toolbar { display: flex; justify-content: space-between; align-items: center; }
	.mc-badge { font-size: 10px; color: var(--accent); letter-spacing: 1px; text-transform: uppercase; }
	.mc-copy {
		font-size: 10px; padding: 3px 8px; background: none; border: 1px solid var(--border);
		border-radius: var(--radius-sm); cursor: pointer; color: var(--text-secondary); font-family: var(--font-mono);
	}
	.mc-copy:hover { border-color: var(--accent); color: var(--accent); }
	.mc-text { font-size: 12px; color: var(--text-primary); white-space: pre-wrap; line-height: 1.6; margin: 0; }
	.mc-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 10px; color: var(--text-muted); }
	.mc-empty-icon { font-size: 36px; opacity: 0.3; }
	.mc-empty p { font-size: 12px; text-align: center; }
	@media (max-width: 640px) {
		.mc-wrap { flex-direction: column; }
		.mc-form { width: 100%; max-height: 50%; }
	}
</style>
