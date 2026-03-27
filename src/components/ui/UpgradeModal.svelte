<script>
	import { upgradeModalOpen, upgradeModalReason, closeUpgradeModal } from '$lib/stores/plan.js';
	import { LS_CONFIG } from '$lib/lemonsqueezy/client.js';
	import { userProfile } from '$lib/stores/user.js';
	import { t } from '$lib/i18n/index.js';

	function openCheckout(variant) {
		const email = $userProfile.email || '';
		const url   = `https://${LS_CONFIG.storeDomain}/checkout/buy/${variant}?checkout[email]=${encodeURIComponent(email)}&checkout[custom][product]=molvicos`;
		window.open(url, '_blank');
		closeUpgradeModal();
	}
</script>

{#if $upgradeModalOpen}
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="upgrade-overlay" on:click|self={closeUpgradeModal}>
		<div class="upgrade-modal">

			<div class="upgrade-header">
				<span class="upgrade-icon">⚡</span>
				<h2>{$t('plans.upgradeTitle')}</h2>
				<button class="upgrade-close" on:click={closeUpgradeModal}>×</button>
			</div>

			{#if $upgradeModalReason.reason}
				<p class="upgrade-reason">{$upgradeModalReason.reason}</p>
			{/if}

			<div class="upgrade-features">
				{#each [
					['∞', $t('plans.unlimitedCredits')],
					['5', $t('plans.workspaces')],
					['◈', $t('plans.miraFull')],
					['🎨', $t('plans.premiumThemes')],
					['📱', $t('plans.mobileApp')],
				] as [icon, label]}
					<div class="upgrade-feat">
						<span class="upgrade-feat-icon">{icon}</span>
						<span>{label}</span>
					</div>
				{/each}
			</div>

			<div class="upgrade-ctas">
				<button
					class="cta-yearly"
					on:click={() => openCheckout(LS_CONFIG.yearlyVariant)}
				>
					$199/year <span class="cta-save">{$t('plans.save89')}</span>
				</button>
				<button
					class="cta-monthly"
					on:click={() => openCheckout(LS_CONFIG.monthlyVariant)}
				>
					$24/month
				</button>
			</div>

			<p class="upgrade-note">{$t('plans.cancelAnytime')}</p>
		</div>
	</div>
{/if}

<style>
	.upgrade-overlay {
		position: fixed; inset: 0; z-index: 9800;
		background: #00000075; backdrop-filter: blur(10px);
		display: flex; align-items: center; justify-content: center;
	}
	.upgrade-modal {
		width: 440px; max-width: calc(100vw - 40px);
		background: var(--bg-elevated);
		border: 1px solid #00ccff40;
		border-radius: var(--radius-lg);
		padding: 24px; font-family: var(--font-mono);
	}
	.upgrade-header {
		display: flex; align-items: center; gap: 10px;
		margin-bottom: 14px;
	}
	.upgrade-icon  { font-size: 20px; color: var(--accent); }
	.upgrade-header h2 {
		flex: 1; font-family: var(--font-display);
		font-size: 16px; color: var(--text-primary); margin: 0;
	}
	.upgrade-close {
		background: none; border: none; cursor: pointer;
		color: var(--text-secondary); font-size: 20px;
	}
	.upgrade-reason {
		font-size: 12px; color: var(--text-secondary);
		margin-bottom: 16px; line-height: 1.6;
		padding: 8px 12px; background: var(--bg-input);
		border-radius: var(--radius-sm); border-left: 2px solid var(--accent-border);
	}
	.upgrade-features {
		display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;
	}
	.upgrade-feat {
		display: flex; align-items: center; gap: 10px;
		font-size: 12px; color: var(--text-primary);
	}
	.upgrade-feat-icon { width: 20px; color: var(--accent); text-align: center; }
	.upgrade-ctas {
		display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;
	}
	.cta-yearly {
		background: var(--accent); border: none; border-radius: var(--radius-md);
		color: #000; font-size: 14px; font-weight: 500; padding: 12px;
		cursor: pointer; font-family: var(--font-mono);
		display: flex; align-items: center; justify-content: center; gap: 8px;
		transition: opacity var(--transition);
	}
	.cta-yearly:hover { opacity: 0.9; }
	.cta-save {
		font-size: 11px; background: #000; color: var(--accent);
		padding: 2px 8px; border-radius: 4px;
	}
	.cta-monthly {
		background: none; border: 1px solid var(--border-accent);
		border-radius: var(--radius-md); color: var(--text-primary);
		font-size: 13px; padding: 10px; cursor: pointer;
		font-family: var(--font-mono); transition: background var(--transition);
	}
	.cta-monthly:hover { background: var(--accent-dim); }
	.upgrade-note {
		text-align: center; font-size: 10px; color: var(--text-secondary);
	}
</style>
