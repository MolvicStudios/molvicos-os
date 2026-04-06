<script>
	import { t } from '$lib/i18n/index.js';
	import { currentLang } from '$lib/i18n/index.js';
	import Step1Language from './Step1Language.svelte';
	import Step2Hardware from './Step2Hardware.svelte';
	import Step3ApiKeys from './Step3ApiKeys.svelte';
	import Step4LocalModels from './Step4LocalModels.svelte';
	import Step5Tutorial from './Step5Tutorial.svelte';
	import ProgressBar from '../ui/ProgressBar.svelte';
	import Wallpaper from '../os/Wallpaper.svelte';

	let step = 1;
	const totalSteps = 5;

	const steps = [Step1Language, Step2Hardware, Step3ApiKeys, Step4LocalModels, Step5Tutorial];

	function next() {
		if (step < totalSteps) step++;
	}

	function back() {
		if (step > 1) step--;
	}

	function skip() {
		step = 5;
	}

	$: stepLabel = $t('onboarding.stepOf').replace('{step}', step).replace('{total}', totalSteps);
	$: canNext = true;
</script>

<div class="onboarding">
	<Wallpaper />

	<div class="ob-container">
		<div class="ob-top">
			<ProgressBar value={step} max={totalSteps} />
			<div class="ob-meta">
				<span class="step-label">{stepLabel}</span>
				{#if step < 5}
					<button class="skip-btn" on:click={skip}>{$t('onboarding.skip')}</button>
				{/if}
			</div>
		</div>

		<div class="ob-body" key={step}>
			{#if step === 1}
				<Step1Language on:next={next} />
			{:else if step === 2}
				<Step2Hardware on:next={next} />
			{:else if step === 3}
				<Step3ApiKeys on:next={next} />
			{:else if step === 4}
				<Step4LocalModels on:next={next} />
			{:else}
				<Step5Tutorial />
			{/if}
		</div>

		{#if step < 5}
			<div class="ob-footer">
				{#if step > 1}
					<button class="btn-back" on:click={back}>{$t('onboarding.back')}</button>
				{:else}
					<div></div>
				{/if}
				<button class="btn-next" on:click={next}>{$t('onboarding.next')}</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.onboarding {
		position: fixed;
		inset: 0;
		z-index: 20000;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow-y: auto;
		padding: 1rem;
	}

	.ob-container {
		position: relative;
		z-index: 1;
		width: 100%;
		max-width: 640px;
		padding: 32px;
		display: flex;
		flex-direction: column;
		gap: 24px;
		animation: slideUp 0.4s ease;
		margin: auto;
	}

	.ob-top {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.ob-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.step-label {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-secondary);
	}

	.skip-btn {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-muted);
		background: none;
		border: none;
		cursor: pointer;
		text-decoration: underline;
	}
	.skip-btn:hover {
		color: var(--text-secondary);
	}

	.ob-body {
		min-height: 320px;
		max-height: 60vh;
		overflow-y: auto;
		animation: fadeIn 0.3s ease;
	}

	.ob-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.btn-back {
		padding: 8px 20px;
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-secondary);
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		cursor: pointer;
	}
	.btn-back:hover {
		border-color: var(--border-accent);
	}

	.btn-next {
		padding: 10px 28px;
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: 13px;
		font-weight: 700;
		color: var(--bg-base);
		background: var(--accent);
		border: none;
		cursor: pointer;
		transition: opacity var(--transition);
	}
	.btn-next:hover {
		opacity: 0.9;
	}
</style>
