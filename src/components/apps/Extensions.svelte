<script>
	import { EXTENSIONS } from '$lib/extensions/index.js';
	import {
		extensionConfigs,
		enableExtension,
		disableExtension,
		updateExtensionConfig,
		isExtensionEnabled,
		getExtensionConfig
	} from '$lib/extensions/store.js';
	import { t } from '$lib/i18n/index.js';

	let selected = null;
	let testResults = {};
	let testing = {};
	let searchQuery = '';

	$: filtered = searchQuery
		? EXTENSIONS.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
		: EXTENSIONS;

	$: enabledCount = EXTENSIONS.filter(e => isExtensionEnabled(e.id, $extensionConfigs)).length;

	function isEnabled(id) {
		return isExtensionEnabled(id, $extensionConfigs);
	}

	function getConfig(id) {
		return getExtensionConfig(id) || {};
	}

	function toggle(ext) {
		if (isEnabled(ext.id)) {
			disableExtension(ext.id);
		} else {
			enableExtension(ext.id, getConfig(ext.id));
		}
	}

	function saveField(extId, key, value) {
		const current = getConfig(extId);
		updateExtensionConfig(extId, { ...current, [key]: value });
	}

	async function testConnection(ext) {
		const config = getConfig(ext.id);
		const hasToken = config.token?.trim();
		if (!hasToken) {
			testResults[ext.id] = { ok: false, msg: 'No token configured' };
			return;
		}
		testing[ext.id] = true;
		testResults[ext.id] = null;
		try {
			// Use the first read-only tool for testing
			const readTool = ext.tools.find(t => t.name.includes('list') || t.name.includes('get') || t.name.includes('search'));
			if (readTool) {
				const result = await ext.execute(readTool.name, {});
				testResults[ext.id] = result?.success
					? { ok: true, msg: 'Connected' }
					: { ok: false, msg: result?.data || 'Failed' };
			} else {
				testResults[ext.id] = { ok: true, msg: 'Token saved' };
			}
		} catch (e) {
			testResults[ext.id] = { ok: false, msg: e.message?.slice(0, 60) || 'Connection error' };
		}
		testing[ext.id] = false;
	}
</script>

<div class="ext-wrap">
	<div class="ext-sidebar">
		<div class="ext-header">
			<span class="ext-title">🔌 Extensions</span>
			<span class="ext-count">{enabledCount}/{EXTENSIONS.length}</span>
		</div>
		<input
			class="ext-search"
			type="text"
			placeholder="Search..."
			bind:value={searchQuery}
		/>
		<div class="ext-list">
			{#each filtered as ext (ext.id)}
				<button
					class="ext-item"
					class:active={selected?.id === ext.id}
					class:enabled={isEnabled(ext.id)}
					on:click={() => selected = ext}
				>
					<span class="ext-emoji">{ext.emoji}</span>
					<div class="ext-item-info">
						<span class="ext-item-name">{ext.name}</span>
						<span class="ext-item-desc">{ext.description}</span>
					</div>
					<span class="ext-status" class:on={isEnabled(ext.id)}>
						{isEnabled(ext.id) ? '●' : '○'}
					</span>
				</button>
			{/each}
		</div>
	</div>

	<div class="ext-detail">
		{#if selected}
			<div class="ext-detail-header">
				<span class="ext-detail-emoji">{selected.emoji}</span>
				<div class="ext-detail-meta">
					<span class="ext-detail-name">{selected.name}</span>
					<span class="ext-detail-desc">{selected.description}</span>
				</div>
				<button
					class="ext-toggle-btn"
					class:on={isEnabled(selected.id)}
					on:click={() => toggle(selected)}
				>
					{isEnabled(selected.id) ? 'Enabled' : 'Disabled'}
				</button>
			</div>

			<div class="ext-config">
				<div class="ext-section-label">Configuration</div>
				{#each selected.fields as field (field.key)}
					<div class="ext-field">
						<label class="ext-field-label">{field.label}</label>
						<input
							class="ext-field-input"
							type={field.type || 'text'}
							placeholder={field.placeholder || ''}
							value={getConfig(selected.id)[field.key] || ''}
							on:input={(e) => saveField(selected.id, field.key, e.target.value)}
						/>
					</div>
				{/each}

				<div class="ext-actions">
					<button
						class="ext-test-btn"
						on:click={() => testConnection(selected)}
						disabled={testing[selected.id]}
					>
						{testing[selected.id] ? '⏳ Testing...' : '🧪 Test Connection'}
					</button>
					{#if testResults[selected.id]}
						<span class="ext-test-result" class:ok={testResults[selected.id].ok}>
							{testResults[selected.id].ok ? '✓' : '✗'} {testResults[selected.id].msg}
						</span>
					{/if}
				</div>
			</div>

			<div class="ext-tools-section">
				<div class="ext-section-label">Available Tools ({selected.tools.length})</div>
				<div class="ext-tools-list">
					{#each selected.tools as tool (tool.name)}
						<div class="ext-tool">
							<span class="ext-tool-name">{tool.name}</span>
							<span class="ext-tool-desc">{tool.description}</span>
						</div>
					{/each}
				</div>
				<div class="ext-hint">
					💡 Ask MIRA to use these tools via natural language. E.g: "List my GitHub repos" or "Send a Telegram message"
				</div>
			</div>
		{:else}
			<div class="ext-empty">
				<span class="ext-empty-icon">🔌</span>
				<span class="ext-empty-text">Select an extension to configure</span>
				<span class="ext-empty-sub">Extensions give MIRA superpowers — connect your services and control them via AI</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.ext-wrap {
		display: flex; height: 100%; font-family: var(--font-mono); overflow: hidden;
	}
	.ext-sidebar {
		width: 220px; flex-shrink: 0; border-right: 1px solid var(--border);
		display: flex; flex-direction: column;
	}
	.ext-header {
		display: flex; align-items: center; justify-content: space-between;
		padding: 12px 12px 8px; border-bottom: 1px solid var(--border);
	}
	.ext-title { font-size: 13px; font-family: var(--font-display); color: var(--text-primary); }
	.ext-count { font-size: 10px; color: var(--text-secondary); background: var(--bg-elevated); padding: 2px 6px; border-radius: 8px; }
	.ext-search {
		margin: 8px 10px; padding: 5px 8px; font-size: 11px;
		background: var(--bg-input, var(--bg-base)); border: 1px solid var(--border);
		border-radius: var(--radius-sm); color: var(--text-primary);
		font-family: var(--font-mono); outline: none;
	}
	.ext-search:focus { border-color: var(--accent); }
	.ext-list { flex: 1; overflow-y: auto; padding: 4px 6px; }
	.ext-item {
		display: flex; align-items: center; gap: 8px; width: 100%;
		padding: 8px 8px; border-radius: var(--radius-sm);
		background: none; border: 1px solid transparent; cursor: pointer;
		text-align: left; font-family: var(--font-mono);
		transition: all var(--transition);
	}
	.ext-item:hover { background: var(--bg-elevated); }
	.ext-item.active { background: var(--accent-dim); border-color: var(--accent-border); }
	.ext-emoji { font-size: 18px; width: 24px; text-align: center; }
	.ext-item-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
	.ext-item-name { font-size: 11px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.ext-item-desc { font-size: 9px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.ext-status { font-size: 10px; color: var(--text-muted); }
	.ext-status.on { color: var(--accent2, #00cc88); }

	.ext-detail { flex: 1; overflow-y: auto; padding: 16px 20px; }
	.ext-detail-header {
		display: flex; align-items: center; gap: 12px;
		padding-bottom: 14px; border-bottom: 1px solid var(--border); margin-bottom: 16px;
	}
	.ext-detail-emoji { font-size: 28px; }
	.ext-detail-meta { flex: 1; display: flex; flex-direction: column; }
	.ext-detail-name { font-size: 15px; font-family: var(--font-display); color: var(--text-primary); }
	.ext-detail-desc { font-size: 11px; color: var(--text-secondary); }
	.ext-toggle-btn {
		background: var(--bg-input); border: 1px solid var(--border);
		border-radius: var(--radius-sm); font-size: 11px; padding: 6px 14px;
		cursor: pointer; font-family: var(--font-mono); color: var(--text-secondary);
		transition: all var(--transition);
	}
	.ext-toggle-btn.on {
		background: var(--accent-dim); border-color: var(--accent-border);
		color: var(--accent);
	}

	.ext-config { margin-bottom: 20px; }
	.ext-section-label {
		font-size: 11px; color: var(--text-secondary); text-transform: uppercase;
		letter-spacing: 0.5px; margin-bottom: 10px;
	}
	.ext-field { margin-bottom: 10px; }
	.ext-field-label { display: block; font-size: 11px; color: var(--text-primary); margin-bottom: 4px; }
	.ext-field-input {
		width: 100%; padding: 7px 10px; font-size: 11px;
		background: var(--bg-input, var(--bg-base)); border: 1px solid var(--border);
		border-radius: var(--radius-sm); color: var(--text-primary);
		font-family: var(--font-mono); outline: none; box-sizing: border-box;
	}
	.ext-field-input:focus { border-color: var(--accent); }
	.ext-actions { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
	.ext-test-btn {
		background: var(--accent-dim); border: 1px solid var(--accent-border);
		color: var(--accent); font-size: 11px; padding: 6px 14px;
		border-radius: var(--radius-sm); cursor: pointer; font-family: var(--font-mono);
	}
	.ext-test-btn:disabled { opacity: 0.5; cursor: not-allowed; }
	.ext-test-result { font-size: 11px; color: var(--text-secondary); }
	.ext-test-result.ok { color: var(--accent2, #00cc88); }

	.ext-tools-section { margin-top: 16px; }
	.ext-tools-list { display: flex; flex-direction: column; gap: 4px; }
	.ext-tool {
		display: flex; flex-direction: column; gap: 1px;
		padding: 6px 8px; border-radius: var(--radius-sm);
		background: var(--bg-elevated); border: 0.5px solid var(--border);
	}
	.ext-tool-name { font-size: 11px; color: var(--accent); font-weight: 500; }
	.ext-tool-desc { font-size: 10px; color: var(--text-secondary); }
	.ext-hint {
		margin-top: 12px; font-size: 10px; color: var(--text-muted);
		padding: 8px 10px; border-radius: var(--radius-sm);
		background: var(--bg-elevated); border: 0.5px solid var(--border);
	}

	.ext-empty {
		display: flex; flex-direction: column; align-items: center;
		justify-content: center; height: 100%; gap: 8px; text-align: center;
	}
	.ext-empty-icon { font-size: 36px; opacity: 0.4; }
	.ext-empty-text { font-size: 13px; color: var(--text-primary); }
	.ext-empty-sub { font-size: 11px; color: var(--text-secondary); max-width: 280px; }
</style>
