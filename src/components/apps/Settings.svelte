<script>
	import { theme, tutorialOpen } from '$lib/stores/os.js';
	import { userProfile } from '$lib/stores/user.js';
	import { apiKeys, ollamaStatus } from '$lib/stores/models.js';
	import { planStore, openUpgradeModal, activatePro, deactivatePro } from '$lib/stores/plan.js';
	import { setLang, currentLang } from '$lib/i18n/index.js';
	import { validateLicense } from '$lib/lemonsqueezy/client.js';
	import { canUse } from '$lib/plans/gates.js';
	import { t } from '$lib/i18n/index.js';

	let activeSection = 'general';
	const sections = [
		{ id: 'general',    icon: '⚙️' },
		{ id: 'appearance', icon: '🎨' },
		{ id: 'ai',         icon: '🤖' },
		{ id: 'account',    icon: '👤' },
		{ id: 'about',      icon: 'ℹ️' },
	];

	let n8nUrl = localStorage.getItem('ms_n8n_url') || 'https://molvicstudios.app.n8n.cloud';
	function saveN8nUrl() {
		localStorage.setItem('ms_n8n_url', n8nUrl);
		showSaved('n8n URL saved');
	}

	let licenseInput = $planStore.licenseKey || '';
	let licenseChecking = false;
	let licenseMessage = '';

	async function activateLicense() {
		if (!licenseInput.trim()) return;
		licenseChecking = true;
		licenseMessage = '';
		const result = await validateLicense(licenseInput.trim());
		licenseChecking = false;
		if (result.valid) {
			activatePro(licenseInput.trim(), result.billingPeriod);
			licenseMessage = '✓ Pro activated!';
		} else {
			licenseMessage = '✗ Invalid license key';
		}
	}

	let savedMsg = '';
	function showSaved(msg) {
		savedMsg = msg;
		setTimeout(() => savedMsg = '', 2500);
	}

	const THEMES = [
		{ id: 'noir',      name: 'Neural Noir', free: true },
		{ id: 'icaro',     name: 'Ícaro',       free: true },
		{ id: 'synthwave', name: 'Synthwave',   free: false },
		{ id: 'ocean',     name: 'Deep Ocean',  free: false },
		{ id: 'matrix',    name: 'Matrix',      free: false },
	];

	function selectTheme(themeId, isFree) {
		if (!isFree && !canUse('themes_premium')) {
			openUpgradeModal('themes_premium', 'Premium themes are exclusive to Pro plan.');
			return;
		}
		theme.set(themeId);
		localStorage.setItem('ms_theme', themeId);
		document.documentElement.setAttribute('data-theme', themeId);
	}

	function saveApiKey(id) {
		localStorage.setItem('ms_api_keys', JSON.stringify($apiKeys));
		showSaved(`${id} key saved`);
	}
</script>

<div class="settings-wrap">
	<div class="settings-nav">
		{#each sections as s}
			<button
				class="sn-item"
				class:active={activeSection === s.id}
				on:click={() => activeSection = s.id}
			>
				<span class="sn-icon">{s.icon}</span>
				<span class="sn-label">{$t(`settings.${s.id}`)}</span>
			</button>
		{/each}
	</div>

	<div class="settings-content">

		{#if activeSection === 'general'}
			<div class="settings-section-title">{$t('settings.general')}</div>

			<div class="setting-row">
				<div class="sr-info">
					<span class="sr-label">{$t('settings.language')}</span>
					<span class="sr-sub">{$t('settings.languageSub')}</span>
				</div>
				<div class="lang-pills">
					{#each [['en','EN'],['es','ES'],['de','DE'],['fr','FR'],['zh','ZH']] as [code, label]}
						<button
							class="lang-pill"
							class:active={$currentLang === code}
							on:click={() => setLang(code)}
						>{label}</button>
					{/each}
				</div>
			</div>

			<div class="setting-row">
				<div class="sr-info">
					<span class="sr-label">{$t('settings.n8nUrl')}</span>
					<span class="sr-sub">{$t('settings.n8nUrlSub')}</span>
				</div>
				<div class="sr-input-row">
					<input bind:value={n8nUrl} placeholder="https://your-n8n.cloud" />
					<button class="sr-save-btn" on:click={saveN8nUrl}>{$t('common.save')}</button>
				</div>
			</div>

			<div class="setting-row">
				<div class="sr-info">
					<span class="sr-label">{$t('settings.openTutorial')}</span>
				</div>
				<button class="sr-save-btn" on:click={() => tutorialOpen.set(true)}>{$t('settings.openTutorial')}</button>
			</div>

		{:else if activeSection === 'appearance'}
			<div class="settings-section-title">{$t('settings.appearance')}</div>

			<div class="theme-grid">
				{#each THEMES as th}
					<button
						class="theme-card"
						class:active={$theme === th.id}
						class:locked={!th.free && !canUse('themes_premium')}
						on:click={() => selectTheme(th.id, th.free)}
					>
						<div class="theme-preview theme-{th.id}"></div>
						<span class="theme-name">{th.name}</span>
						{#if !th.free && !canUse('themes_premium')}
							<span class="theme-lock">🔒 Pro</span>
						{/if}
					</button>
				{/each}
			</div>

		{:else if activeSection === 'ai'}
			<div class="settings-section-title">{$t('settings.ai')}</div>

			<div class="sr-sub" style="margin-bottom:14px">
				{$t('settings.keysLocal')}
			</div>

			{#each [
				['groq',      'Groq',      'gsk_',    'https://console.groq.com',          true],
				['openai',    'OpenAI',    'sk-',     'https://platform.openai.com',        false],
				['anthropic', 'Anthropic', 'sk-ant-', 'https://console.anthropic.com',      false],
				['gemini',    'Gemini',    'AIza',    'https://aistudio.google.com',         true],
				['mistral',   'Mistral',   'mis_',    'https://console.mistral.ai',          true],
			] as [id, name, prefix, url, free]}
				<div class="api-key-row">
					<div class="akr-info">
						<span class="akr-name">{name}</span>
						{#if free}<span class="akr-free">free tier</span>{/if}
					</div>
					<input
						type="password"
						placeholder="{prefix}..."
						bind:value={$apiKeys[id]}
						on:change={() => saveApiKey(id)}
					/>
					<a href={url} target="_blank" rel="noopener noreferrer" class="akr-link">Get key →</a>
				</div>
			{/each}

			<div class="setting-row" style="margin-top:16px">
				<div class="sr-info">
					<span class="sr-label">{$t('settings.ollamaStatus')}</span>
					<span class="sr-sub">Local AI (localhost:11434)</span>
				</div>
				<span class="ollama-status" class:online={$ollamaStatus === 'online'}>
					{$ollamaStatus === 'online' ? '● Online' : '○ Offline'}
				</span>
			</div>

		{:else if activeSection === 'account'}
			<div class="settings-section-title">{$t('settings.account')}</div>

			<div class="current-plan-card" class:pro={$planStore.plan === 'pro'}>
				<div class="cpc-left">
					<span class="cpc-plan">{$planStore.plan === 'pro' ? '⚡ Pro' : '🆓 Free'}</span>
					{#if $planStore.billingPeriod}
						<span class="cpc-billing">{$planStore.billingPeriod} billing</span>
					{/if}
				</div>
				{#if $planStore.plan === 'free'}
					<button class="cpc-upgrade" on:click={() => openUpgradeModal()}>
					{$t('plans.upgradeTitle')} →
					</button>
				{/if}
			</div>

			{#if $planStore.plan === 'free'}
				<div class="license-section">
					<span class="sr-label">{$t('settings.licenseKey')}</span>
					<span class="sr-sub">{$t('settings.licenseKeySub')}</span>
					<div class="license-input-row">
						<input
							bind:value={licenseInput}
							placeholder="Enter license key..."
							type="text"
						/>
						<button
							class="license-activate-btn"
							on:click={activateLicense}
							disabled={licenseChecking || !licenseInput.trim()}
						>
						{licenseChecking ? $t('common.loading') : $t('settings.activate')}
						</button>
					</div>
					{#if licenseMessage}
						<span class="license-msg" class:success={licenseMessage.startsWith('✓')}>
							{licenseMessage}
						</span>
					{/if}
				</div>
			{:else}
				<div class="setting-row">
					<div class="sr-info">
					<span class="sr-label">{$t('settings.licenseKey')}</span>
						<span class="sr-sub">●●●●●●●● Pro {$t('settings.activate')}d</span>
					</div>
					<button class="sr-danger-btn" on:click={deactivatePro}>{$t('settings.deactivate')}</button>
				</div>
			{/if}

		{:else if activeSection === 'about'}
			<div class="settings-section-title">{$t('settings.about')}</div>
			<div class="about-content">
				<div class="about-logo">◈ MOLVICOS</div>
				<div class="about-version">AI Operating System · v0.1.0-beta</div>
				<div class="about-links">
					<a href="https://molvicos.pro" target="_blank" rel="noopener noreferrer">molvicos.pro</a>
					<a href="https://molvicstudios.pro" target="_blank" rel="noopener noreferrer">MolvicStudios</a>
				</div>
			</div>
		{/if}

		{#if savedMsg}
			<div class="settings-toast">{savedMsg}</div>
		{/if}
	</div>
</div>

<style>
	.settings-wrap {
		display: flex; height: 100%; font-family: var(--font-mono); overflow: hidden;
	}
	.settings-nav {
		width: 160px; flex-shrink: 0; border-right: 1px solid var(--border);
		padding: 12px 8px; display: flex; flex-direction: column; gap: 2px;
	}
	.sn-item {
		display: flex; align-items: center; gap: 8px;
		padding: 8px 10px; border-radius: var(--radius-sm);
		background: none; border: none; cursor: pointer;
		font-size: 11px; color: var(--text-secondary);
		font-family: var(--font-mono); text-align: left; width: 100%;
		transition: all var(--transition);
	}
	.sn-item:hover  { background: var(--bg-elevated); color: var(--text-primary); }
	.sn-item.active { background: var(--accent-dim); color: var(--accent); }
	.sn-icon  { font-size: 13px; width: 18px; }

	.settings-content {
		flex: 1; overflow-y: auto; padding: 16px 20px; position: relative;
	}
	.settings-section-title {
		font-family: var(--font-display); font-size: 15px;
		color: var(--text-primary); margin-bottom: 18px;
	}

	.setting-row {
		display: flex; align-items: center; justify-content: space-between;
		padding: 12px 0; border-bottom: 0.5px solid var(--border); gap: 12px;
	}
	.sr-info { display: flex; flex-direction: column; gap: 2px; }
	.sr-label { font-size: 12px; color: var(--text-primary); }
	.sr-sub   { font-size: 10px; color: var(--text-secondary); }

	.sr-input-row { display: flex; gap: 6px; }
	.sr-input-row input {
		flex: 1; padding: 6px 8px; font-size: 11px;
		background: var(--bg-input, var(--bg-base)); border: 1px solid var(--border);
		border-radius: var(--radius-sm); color: var(--text-primary);
		font-family: var(--font-mono); outline: none;
	}
	.sr-input-row input:focus { border-color: var(--accent); }
	.sr-save-btn {
		background: var(--accent-dim); border: 1px solid var(--accent-border);
		color: var(--accent); font-size: 11px; padding: 6px 12px;
		border-radius: var(--radius-sm); cursor: pointer; font-family: var(--font-mono);
	}
	.sr-danger-btn {
		background: none; border: 1px solid var(--danger, #ff4444);
		color: var(--danger, #ff4444); font-size: 11px; padding: 5px 10px;
		border-radius: var(--radius-sm); cursor: pointer; font-family: var(--font-mono);
	}

	.lang-pills { display: flex; gap: 4px; }
	.lang-pill {
		background: none; border: 1px solid var(--border);
		border-radius: var(--radius-sm); font-size: 10px; padding: 4px 8px;
		cursor: pointer; font-family: var(--font-mono); color: var(--text-secondary);
		transition: all var(--transition);
	}
	.lang-pill.active { background: var(--accent-dim); border-color: var(--accent-border); color: var(--accent); }

	.theme-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
	.theme-card {
		background: none; border: 1px solid var(--border);
		border-radius: var(--radius-md); padding: 10px;
		cursor: pointer; display: flex; flex-direction: column; gap: 6px;
		align-items: center; position: relative; transition: border-color var(--transition);
	}
	.theme-card.active { border-color: var(--accent-border); }
	.theme-card.locked { opacity: 0.6; }
	.theme-preview { width: 100%; height: 36px; border-radius: 4px; }
	.theme-noir      { background: #06090f; border: 1px solid #00ff8830; }
	.theme-icaro     { background: #f5f0e8; border: 1px solid #1a105030; }
	.theme-synthwave { background: #0d0014; border: 1px solid #ff00ff30; }
	.theme-ocean     { background: #00050f; border: 1px solid #0044ff30; }
	.theme-matrix    { background: #000800; border: 1px solid #00ff0030; }
	.theme-name  { font-size: 10px; color: var(--text-secondary); }
	.theme-lock  { font-size: 9px; color: var(--text-muted); }

	.api-key-row {
		display: flex; align-items: center; gap: 8px;
		padding: 8px 0; border-bottom: 0.5px solid var(--border);
	}
	.akr-info { width: 80px; }
	.akr-name { font-size: 11px; color: var(--text-primary); display: block; }
	.akr-free { font-size: 9px; color: var(--accent); }
	.api-key-row input {
		flex: 1; font-size: 11px; padding: 6px 8px;
		background: var(--bg-input, var(--bg-base)); border: 1px solid var(--border);
		border-radius: var(--radius-sm); color: var(--text-primary);
		font-family: var(--font-mono); outline: none;
	}
	.api-key-row input:focus { border-color: var(--accent); }
	.akr-link { font-size: 10px; color: var(--accent); text-decoration: none; white-space: nowrap; }

	.ollama-status { font-size: 11px; color: var(--text-secondary); }
	.ollama-status.online { color: var(--accent2, #00cc88); }

	.current-plan-card {
		display: flex; align-items: center; justify-content: space-between;
		padding: 12px 14px; border-radius: var(--radius-md);
		background: var(--bg-input); border: 1px solid var(--border);
		margin-bottom: 16px;
	}
	.current-plan-card.pro { border-color: var(--accent-border); }
	.cpc-left { display: flex; flex-direction: column; gap: 2px; }
	.cpc-plan    { font-size: 13px; color: var(--text-primary); display: block; }
	.cpc-billing { font-size: 10px; color: var(--text-secondary); }
	.cpc-upgrade {
		background: var(--accent); border: none; border-radius: var(--radius-sm);
		color: #000; font-size: 11px; padding: 6px 14px;
		cursor: pointer; font-family: var(--font-mono);
	}

	.license-section { display: flex; flex-direction: column; gap: 6px; }
	.license-input-row { display: flex; gap: 6px; margin-top: 4px; }
	.license-input-row input {
		flex: 1; padding: 6px 8px; font-size: 11px;
		background: var(--bg-input, var(--bg-base)); border: 1px solid var(--border);
		border-radius: var(--radius-sm); color: var(--text-primary);
		font-family: var(--font-mono); outline: none;
	}
	.license-input-row input:focus { border-color: var(--accent); }
	.license-activate-btn {
		background: var(--accent-dim); border: 1px solid var(--accent-border);
		color: var(--accent); font-size: 11px; padding: 6px 12px;
		border-radius: var(--radius-sm); cursor: pointer; font-family: var(--font-mono);
	}
	.license-activate-btn:disabled { opacity: 0.4; cursor: not-allowed; }
	.license-msg { font-size: 11px; color: var(--danger, #ff4444); }
	.license-msg.success { color: var(--accent2, #00cc88); }

	.about-content { display: flex; flex-direction: column; gap: 10px; padding: 20px 0; }
	.about-logo    { font-family: var(--font-display); font-size: 22px; color: var(--accent); letter-spacing: 4px; }
	.about-version { font-size: 11px; color: var(--text-secondary); }
	.about-links   { display: flex; gap: 14px; }
	.about-links a { font-size: 11px; color: var(--accent); text-decoration: none; }

	.settings-toast {
		position: fixed; bottom: 20px; right: 20px;
		background: var(--accent); color: #000;
		font-size: 11px; padding: 7px 16px;
		border-radius: var(--radius-sm); font-family: var(--font-mono);
		animation: slideUp 0.2s ease;
	}

	@keyframes slideUp {
		from { transform: translateY(10px); opacity: 0; }
		to { transform: translateY(0); opacity: 1; }
	}
</style>
