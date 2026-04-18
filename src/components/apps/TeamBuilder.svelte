<script>
	import { t } from '$lib/i18n/index.js';
	import { apiKeys, ollamaModels, ollamaStatus } from '$lib/stores/models.js';
	import { notify } from '$lib/stores/os.js';
	import { exportTXT } from '$lib/utils/export.js';
	import AppShell from './shared/AppShell.svelte';

	export const id = 'teambuilder';

	// ── Providers / models ────────────────────────────────────────────────
	const PROVIDER_MODELS = {
		groq:      'llama-3.3-70b-versatile',
		openai:    'gpt-4o-mini',
		anthropic: 'claude-haiku-4-5-20251001',
		gemini:    'gemini-1.5-flash',
		mistral:   'mistral-small-latest'
	};

	const TEAM_TEMPLATES = {
		startup: {
			label: '🚀 Startup Team',
			members: [
				{ emoji: '🧠', name: 'Alex', role: 'CEO', system: 'You are Alex, CEO of a tech startup. You think strategically, focus on vision, market positioning, and business decisions. Be concise and decisive.' },
				{ emoji: '💻', name: 'Sam', role: 'Lead Dev', system: 'You are Sam, Lead Developer. You think in terms of technical feasibility, architecture, and implementation. Be pragmatic and solution-oriented.' },
				{ emoji: '📣', name: 'Jordan', role: 'Marketing', system: 'You are Jordan, Marketing Lead. You focus on brand, growth hacking, and user acquisition. Be creative and data-driven.' },
				{ emoji: '🎨', name: 'Casey', role: 'Designer', system: 'You are Casey, UX/UI Designer. You prioritize user experience, design systems, and visual storytelling. Be empathetic and detail-oriented.' }
			]
		},
		dev: {
			label: '🛠 Dev Team',
			members: [
				{ emoji: '🏗', name: 'Arch', role: 'Architect', system: 'You are Arch, Software Architect. You focus on system design, scalability, and technical standards. Be thorough and structured.' },
				{ emoji: '💻', name: 'Dev', role: 'Full-Stack Dev', system: 'You are Dev, Full-Stack Developer. You implement features across frontend and backend with clean, maintainable code.' },
				{ emoji: '🧪', name: 'Tess', role: 'QA Engineer', system: 'You are Tess, QA Engineer. You find edge cases, write test scenarios, and ensure quality. Be skeptical and rigorous.' },
				{ emoji: '🔒', name: 'Sec', role: 'Security', system: 'You are Sec, Security Engineer. You identify vulnerabilities, ensure compliance, and recommend secure practices.' }
			]
		},
		content: {
			label: '✍ Content Team',
			members: [
				{ emoji: '✍', name: 'Writer', role: 'Copywriter', system: 'You are a professional Copywriter. You craft compelling, clear, and on-brand written content.' },
				{ emoji: '📊', name: 'SEO', role: 'SEO Specialist', system: 'You are an SEO Specialist. You optimize content for search engines while keeping it readable and valuable.' },
				{ emoji: '📱', name: 'Social', role: 'Social Media', system: 'You are a Social Media Manager. You adapt content for different platforms with engaging, viral-worthy angles.' },
				{ emoji: '📐', name: 'Edit', role: 'Editor', system: 'You are an Editor. You review, refine, and improve all content for clarity, accuracy, and consistency.' }
			]
		},
		strategy: {
			label: '📈 Strategy Team',
			members: [
				{ emoji: '📈', name: 'Strategy', role: 'Strategist', system: 'You are a Business Strategist. You analyze markets, identify opportunities, and build winning strategies.' },
				{ emoji: '💰', name: 'Finance', role: 'CFO', system: 'You are the CFO. You evaluate financial viability, ROI, cash flow, and financial risk.' },
				{ emoji: '⚖', name: 'Legal', role: 'Legal Advisor', system: 'You are a Legal Advisor. You identify legal risks, compliance needs, and contractual considerations.' },
				{ emoji: '🌍', name: 'BizDev', role: 'Business Dev', system: 'You are the Business Development Manager. You identify partnerships, expansion opportunities, and new markets.' }
			]
		}
	};

	// ── State ─────────────────────────────────────────────────────────────
	let members = [];
	let messages = [];
	let chatInput = '';
	let chatMode = 'roundrobin'; // 'roundrobin' | 'consensus' | string (member id for targeted)
	let loading = false;
	let activeMemberId = null;
	let showAddMember = false;
	let editingMemberId = null;

	// New/edit member form
	let form = { emoji: '🤖', name: '', role: '', system: '' };
	let memberIdCounter = 1;

	// Panel state for mobile
	let activePanel = 'members'; // 'members' | 'chat'

	$: keys = $apiKeys;
	$: ollamaOnline = $ollamaStatus === 'online';
	$: ollamaMdls = $ollamaModels;

	function getProvider() {
		const priority = ['groq', 'openai', 'anthropic', 'gemini', 'mistral'];
		for (const p of priority) {
			if (keys[p]?.trim()) return { provider: p, model: PROVIDER_MODELS[p], key: keys[p] };
		}
		if (ollamaOnline && ollamaMdls.length > 0) {
			return { provider: 'ollama', model: ollamaMdls[0].name, key: null };
		}
		return null;
	}

	// ── Templates ─────────────────────────────────────────────────────────
	function loadTemplate(key) {
		const tpl = TEAM_TEMPLATES[key];
		if (!tpl) return;
		members = tpl.members.map(m => ({ ...m, id: memberIdCounter++ }));
		messages = [];
		notify(`Team "${tpl.label}" loaded`, 'success');
	}

	// ── Member management ─────────────────────────────────────────────────
	function openAddMember() {
		form = { emoji: '🤖', name: '', role: '', system: '' };
		editingMemberId = null;
		showAddMember = true;
	}

	function editMember(m) {
		form = { emoji: m.emoji, name: m.name, role: m.role, system: m.system };
		editingMemberId = m.id;
		showAddMember = true;
	}

	function saveMember() {
		if (!form.name.trim() || !form.role.trim()) return;
		if (editingMemberId !== null) {
			members = members.map(m => m.id === editingMemberId ? { ...m, ...form } : m);
		} else {
			members = [...members, { ...form, id: memberIdCounter++ }];
		}
		showAddMember = false;
	}

	function removeMember(id) {
		members = members.filter(m => m.id !== id);
	}

	// ── Chat ──────────────────────────────────────────────────────────────
	async function sendMessage() {
		const text = chatInput.trim();
		if (!text || loading || members.length === 0) return;

		const prov = getProvider();
		if (!prov) {
			notify('No AI provider configured. Add an API key in Settings.', 'error');
			return;
		}

		messages = [...messages, { role: 'user', content: text, timestamp: Date.now() }];
		chatInput = '';
		loading = true;
		activePanel = 'chat';

		try {
			if (chatMode === 'roundrobin') {
				await runRoundRobin(text, prov);
			} else if (chatMode === 'consensus') {
				await runConsensus(text, prov);
			} else {
				// Targeted: chatMode is member id
				const member = members.find(m => String(m.id) === chatMode);
				if (member) await runTargeted(text, member, prov);
			}
		} catch (e) {
			notify(`Error: ${e.message}`, 'error');
		} finally {
			loading = false;
			activeMemberId = null;
		}
	}

	async function callMember(member, userText, prov) {
		const history = messages
			.filter(m => m.role === 'user')
			.slice(-6)
			.map(m => ({ role: 'user', content: m.content }));

		const res = await fetch('/api/ai', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				provider: prov.provider,
				apiKey: prov.key || null,
				model: prov.model,
				system: member.system,
				messages: [...history, { role: 'user', content: userText }],
				temperature: 0.7,
				stream: false
			})
		});

		if (!res.ok) throw new Error(`API error ${res.status}`);

		const data = await res.json();
		// Extract content from OpenAI-style or Anthropic response
		return data.choices?.[0]?.message?.content ||
			   data.content?.[0]?.text ||
			   '';
	}

	async function runRoundRobin(text, prov) {
		for (const member of members) {
			activeMemberId = member.id;
			const reply = await callMember(member, text, prov);
			if (reply) {
				messages = [...messages, {
					role: 'agent',
					member,
					content: reply,
					timestamp: Date.now()
				}];
			}
		}
	}

	async function runTargeted(text, member, prov) {
		activeMemberId = member.id;
		const reply = await callMember(member, text, prov);
		if (reply) {
			messages = [...messages, {
				role: 'agent',
				member,
				content: reply,
				timestamp: Date.now()
			}];
		}
	}

	async function runConsensus(text, prov) {
		// Collect all individual responses
		const responses = [];
		for (const member of members) {
			activeMemberId = member.id;
			const reply = await callMember(member, text, prov);
			if (reply) responses.push({ member, content: reply });
		}

		// Show individual responses
		for (const r of responses) {
			messages = [...messages, {
				role: 'agent',
				member: r.member,
				content: r.content,
				timestamp: Date.now()
			}];
		}

		// Generate summary
		activeMemberId = null;
		const summaryPrompt = `The following team members responded to: "${text}"\n\n` +
			responses.map(r => `${r.member.emoji} ${r.member.name} (${r.member.role}): ${r.content}`).join('\n\n') +
			'\n\nSummarize the key points and consensus, noting any disagreements.';

		const synthRes = await fetch('/api/ai', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				provider: prov.provider,
				apiKey: prov.key || null,
				model: prov.model,
				system: 'You are a neutral facilitator summarizing a multi-agent team discussion. Be concise and highlight consensus and diverging views.',
				messages: [{ role: 'user', content: summaryPrompt }],
				temperature: 0.4,
				stream: false
			})
		});

		if (synthRes.ok) {
			const data = await synthRes.json();
			const synthesis = data.choices?.[0]?.message?.content || data.content?.[0]?.text || '';
			if (synthesis) {
				messages = [...messages, {
					role: 'synthesis',
					content: synthesis,
					timestamp: Date.now()
				}];
			}
		}
	}

	function handleKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	function clearChat() {
		messages = [];
	}

	function exportChat() {
		if (!messages.length) return;
		const lines = messages.map(m => {
			if (m.role === 'user') return `[YOU]: ${m.content}`;
			if (m.role === 'agent') return `[${m.member.emoji} ${m.member.name} — ${m.member.role}]: ${m.content}`;
			if (m.role === 'synthesis') return `[📋 SYNTHESIS]: ${m.content}`;
			return m.content;
		});
		exportTXT(lines.join('\n\n'), 'team-chat.txt');
	}
</script>

<AppShell
	title={$t('apps.teambuilder.name')}
	icon="👥"
	credits={3}
	result={messages.length > 0 ? 'data' : ''}
	onExport={messages.length > 0 ? exportChat : null}
	onClear={messages.length > 0 ? clearChat : null}
>
	<div class="tb-root">
		<!-- ── Mobile panel toggle ──────────── -->
		<div class="mobile-tabs">
			<button class="mtab" class:active={activePanel === 'members'} on:click={() => activePanel = 'members'}>
				👥 {$t('apps.teambuilder.teamTab')}
			</button>
			<button class="mtab" class:active={activePanel === 'chat'} on:click={() => activePanel = 'chat'}>
				💬 {$t('apps.teambuilder.chatTab')}
			</button>
		</div>

		<!-- ── Members panel ─────────────────── -->
		<div class="members-panel" class:hidden-mobile={activePanel !== 'members'}>
			<!-- Header -->
			<div class="panel-header">
				<span class="panel-title">{$t('apps.teambuilder.team')}</span>
				<div class="panel-header-actions">
					<select
						class="template-select"
						on:change={(e) => { loadTemplate(e.target.value); e.target.value = ''; }}
					>
						<option value="">{$t('apps.teambuilder.templates')}</option>
						{#each Object.entries(TEAM_TEMPLATES) as [key, tpl]}
							<option value={key}>{tpl.label}</option>
						{/each}
					</select>
					<button class="btn-add" on:click={openAddMember}>+ {$t('apps.teambuilder.addMember')}</button>
				</div>
			</div>

			<!-- Member list -->
			<div class="member-list">
				{#if members.length === 0}
					<div class="empty-team">
						<p>{$t('apps.teambuilder.emptyTeam')}</p>
					</div>
				{:else}
					{#each members as member (member.id)}
						<div
							class="member-card"
							class:thinking={activeMemberId === member.id && loading}
						>
							<span class="member-emoji">{member.emoji}</span>
							<div class="member-info">
								<span class="member-name">{member.name}</span>
								<span class="member-role">{member.role}</span>
							</div>
							<div class="member-actions">
								<button class="m-btn" on:click={() => editMember(member)} title="Edit">✎</button>
								<button class="m-btn danger" on:click={() => removeMember(member.id)} title="Remove">✕</button>
							</div>
							{#if activeMemberId === member.id && loading}
								<span class="thinking-badge">thinking...</span>
							{/if}
						</div>
					{/each}
				{/if}
			</div>

			<!-- Add/Edit member form -->
			{#if showAddMember}
				<div class="member-form">
					<div class="form-title">{editingMemberId !== null ? $t('apps.teambuilder.editMember') : $t('apps.teambuilder.newMember')}</div>
					<div class="form-row">
						<input class="form-emoji" bind:value={form.emoji} maxlength="2" placeholder="🤖" />
						<input class="form-input" bind:value={form.name} placeholder={$t('apps.teambuilder.memberName')} />
					</div>
					<input class="form-input" bind:value={form.role} placeholder={$t('apps.teambuilder.memberRole')} />
					<textarea
						class="form-textarea"
						bind:value={form.system}
						placeholder={$t('apps.teambuilder.systemPrompt')}
						rows="3"
					></textarea>
					<div class="form-actions">
						<button class="btn-cancel" on:click={() => showAddMember = false}>{$t('common.cancel')}</button>
						<button
							class="btn-save"
							disabled={!form.name.trim() || !form.role.trim()}
							on:click={saveMember}
						>{$t('common.save')}</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- ── Chat panel ─────────────────────── -->
		<div class="chat-panel" class:hidden-mobile={activePanel !== 'chat'}>
			<!-- Mode selector -->
			<div class="chat-controls">
				<select class="mode-select" bind:value={chatMode}>
					<option value="roundrobin">🔄 {$t('apps.teambuilder.roundrobin')}</option>
					<option value="consensus">🤝 {$t('apps.teambuilder.consensus')}</option>
					{#each members as m}
						<option value={String(m.id)}>{m.emoji} {m.name} ({m.role})</option>
					{/each}
				</select>
			</div>

			<!-- Messages -->
			<div class="chat-messages">
				{#if messages.length === 0}
					<div class="chat-empty">
						<span>👥</span>
						<p>{$t('apps.teambuilder.chatEmpty')}</p>
					</div>
				{:else}
					{#each messages as msg (msg.timestamp)}
						{#if msg.role === 'user'}
							<div class="msg user-msg">
								<span class="msg-label">You</span>
								<p class="msg-text">{msg.content}</p>
							</div>
						{:else if msg.role === 'agent'}
							<div class="msg agent-msg">
								<div class="agent-tag">
									<span class="agent-emoji">{msg.member.emoji}</span>
									<span class="agent-name">{msg.member.name}</span>
									<span class="agent-role">{msg.member.role}</span>
								</div>
								<p class="msg-text">{msg.content}</p>
							</div>
						{:else if msg.role === 'synthesis'}
							<div class="msg synthesis-msg">
								<div class="agent-tag">
									<span>📋</span>
									<span class="agent-name">{$t('apps.teambuilder.synthesis')}</span>
								</div>
								<p class="msg-text">{msg.content}</p>
							</div>
						{/if}
					{/each}
					{#if loading}
						<div class="loading-row">
							<span class="ld"></span><span class="ld"></span><span class="ld"></span>
							{#if activeMemberId !== null}
								{@const active = members.find(m => m.id === activeMemberId)}
								{#if active}
									<span class="ld-label">{active.emoji} {active.name} is typing...</span>
								{/if}
							{/if}
						</div>
					{/if}
				{/if}
			</div>

			<!-- Input -->
			<div class="chat-input-area">
				<textarea
					class="chat-input"
					bind:value={chatInput}
					on:keydown={handleKeydown}
					placeholder={members.length === 0 ? $t('apps.teambuilder.addMemberFirst') : $t('apps.teambuilder.inputPlaceholder')}
					rows="2"
					disabled={loading || members.length === 0}
				></textarea>
				<button
					class="send-btn"
					disabled={!chatInput.trim() || loading || members.length === 0}
					on:click={sendMessage}
				>↑</button>
			</div>
		</div>
	</div>
</AppShell>

<style>
	.tb-root {
		display: flex;
		height: 100%;
		overflow: hidden;
		padding: 0;
		gap: 0;
	}

	/* ── Mobile tabs ─────────────────────── */
	.mobile-tabs {
		display: none;
		position: absolute;
		top: 36px;
		left: 0;
		right: 0;
		z-index: 10;
		background: var(--bg-elevated);
		border-bottom: 1px solid var(--border);
	}

	@media (max-width: 600px) {
		.mobile-tabs { display: flex; }
		.tb-root { flex-direction: column; padding-top: 36px; }
		.hidden-mobile { display: none !important; }
		.members-panel,
		.chat-panel { height: 100%; }
	}

	.mtab {
		flex: 1;
		padding: 8px;
		border: none;
		background: transparent;
		color: var(--text-muted);
		font-family: var(--font-mono);
		font-size: 12px;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all var(--transition);
	}

	.mtab.active {
		color: var(--accent);
		border-bottom-color: var(--accent);
	}

	/* ── Members panel ─────────────────── */
	.members-panel {
		width: 240px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		border-right: 1px solid var(--border);
		background: var(--bg-elevated);
		overflow: hidden;
	}

	.panel-header {
		padding: 10px 12px;
		border-bottom: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		gap: 6px;
		flex-shrink: 0;
	}

	.panel-title {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.panel-header-actions {
		display: flex;
		gap: 6px;
		align-items: center;
	}

	.template-select {
		flex: 1;
		padding: 4px 6px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: var(--bg-base);
		color: var(--text-secondary);
		font-family: var(--font-mono);
		font-size: 10px;
	}

	.btn-add {
		padding: 4px 8px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--accent);
		background: transparent;
		color: var(--accent);
		font-family: var(--font-mono);
		font-size: 10px;
		cursor: pointer;
		white-space: nowrap;
		transition: all var(--transition);
	}

	.btn-add:hover {
		background: var(--accent);
		color: var(--bg-base);
	}

	.member-list {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.empty-team {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--text-muted);
		font-family: var(--font-mono);
		font-size: 11px;
		text-align: center;
		padding: 20px;
	}

	.member-card {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 10px;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		background: var(--bg-base);
		transition: all var(--transition);
		position: relative;
	}

	.member-card.thinking {
		border-color: var(--accent);
		box-shadow: 0 0 8px rgba(var(--accent-rgb, 0, 200, 150), 0.2);
	}

	.member-emoji {
		font-size: 20px;
		flex-shrink: 0;
	}

	.member-info {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.member-name {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-primary);
		font-weight: 600;
	}

	.member-role {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--text-muted);
	}

	.member-actions {
		display: flex;
		gap: 2px;
	}

	.m-btn {
		width: 22px;
		height: 22px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: transparent;
		color: var(--text-muted);
		font-size: 12px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition);
	}

	.m-btn:hover { color: var(--text-primary); border-color: var(--text-secondary); }
	.m-btn.danger:hover { color: var(--danger); border-color: var(--danger); }

	.thinking-badge {
		position: absolute;
		bottom: -8px;
		right: 8px;
		background: var(--accent);
		color: var(--bg-base);
		font-family: var(--font-mono);
		font-size: 8px;
		padding: 1px 5px;
		border-radius: 4px;
	}

	/* ── Member form ─────────────────────── */
	.member-form {
		border-top: 1px solid var(--border);
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 6px;
		background: var(--bg-elevated);
		flex-shrink: 0;
	}

	.form-title {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--text-muted);
		text-transform: uppercase;
	}

	.form-row {
		display: flex;
		gap: 6px;
	}

	.form-emoji {
		width: 40px;
		padding: 5px;
		text-align: center;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: var(--bg-base);
		color: var(--text-primary);
		font-size: 16px;
	}

	.form-input {
		flex: 1;
		padding: 5px 8px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: var(--bg-base);
		color: var(--text-primary);
		font-family: var(--font-mono);
		font-size: 11px;
	}

	.form-textarea {
		width: 100%;
		padding: 6px 8px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: var(--bg-base);
		color: var(--text-primary);
		font-family: var(--font-mono);
		font-size: 11px;
		resize: none;
		line-height: 1.5;
		box-sizing: border-box;
	}

	.form-textarea:focus,
	.form-input:focus,
	.form-emoji:focus { outline: none; border-color: var(--accent); }

	.form-actions {
		display: flex;
		gap: 6px;
		justify-content: flex-end;
	}

	.btn-cancel {
		padding: 5px 10px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: transparent;
		color: var(--text-secondary);
		font-family: var(--font-mono);
		font-size: 11px;
		cursor: pointer;
	}

	.btn-save {
		padding: 5px 10px;
		border-radius: var(--radius-sm);
		border: none;
		background: var(--accent);
		color: var(--bg-base);
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 600;
		cursor: pointer;
		transition: opacity var(--transition);
	}

	.btn-save:disabled { opacity: 0.4; cursor: not-allowed; }

	/* ── Chat panel ──────────────────────── */
	.chat-panel {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.chat-controls {
		padding: 8px 12px;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}

	.mode-select {
		width: 100%;
		padding: 5px 8px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: var(--bg-elevated);
		color: var(--text-secondary);
		font-family: var(--font-mono);
		font-size: 11px;
	}

	.chat-messages {
		flex: 1;
		overflow-y: auto;
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		scroll-behavior: smooth;
	}

	.chat-messages::-webkit-scrollbar { width: 4px; }
	.chat-messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

	.chat-empty {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		color: var(--text-muted);
		font-family: var(--font-mono);
		font-size: 28px;
	}

	.chat-empty p {
		font-size: 11px;
		text-align: center;
		opacity: 0.6;
	}

	.msg {
		display: flex;
		flex-direction: column;
		gap: 4px;
		max-width: 90%;
	}

	.user-msg {
		align-self: flex-end;
		align-items: flex-end;
	}

	.agent-msg, .synthesis-msg {
		align-self: flex-start;
	}

	.msg-label {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--text-muted);
	}

	.msg-text {
		padding: 8px 12px;
		border-radius: var(--radius-md);
		font-family: var(--font-mono);
		font-size: 12px;
		line-height: 1.6;
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.user-msg .msg-text {
		background: var(--accent);
		color: var(--bg-base);
		border-bottom-right-radius: 4px;
	}

	.agent-msg .msg-text {
		background: var(--bg-elevated);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-bottom-left-radius: 4px;
	}

	.synthesis-msg .msg-text {
		background: var(--bg-active);
		color: var(--text-primary);
		border: 1px solid var(--accent);
		border-bottom-left-radius: 4px;
	}

	.agent-tag {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.agent-emoji { font-size: 14px; }

	.agent-name {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-primary);
		font-weight: 600;
	}

	.agent-role {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--text-muted);
	}

	.loading-row {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 0;
	}

	.ld {
		width: 6px;
		height: 6px;
		background: var(--accent);
		border-radius: 50%;
		animation: ldbounce 0.9s infinite;
	}

	.ld:nth-child(2) { animation-delay: 0.15s; }
	.ld:nth-child(3) { animation-delay: 0.3s; }

	@keyframes ldbounce {
		0%, 80%, 100% { transform: scale(1); }
		40% { transform: scale(1.5); }
	}

	.ld-label {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--text-muted);
	}

	/* ── Chat input ──────────────────────── */
	.chat-input-area {
		display: flex;
		gap: 6px;
		padding: 10px 12px;
		border-top: 1px solid var(--border);
		background: var(--bg-elevated);
		flex-shrink: 0;
	}

	.chat-input {
		flex: 1;
		padding: 8px 10px;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		background: var(--bg-base);
		color: var(--text-primary);
		font-family: var(--font-mono);
		font-size: 13px;
		resize: none;
		outline: none;
		line-height: 1.5;
		transition: border-color var(--transition);
	}

	.chat-input:focus { border-color: var(--accent); }

	.send-btn {
		width: 36px;
		height: 36px;
		align-self: flex-end;
		border-radius: var(--radius-md);
		border: none;
		background: var(--accent);
		color: var(--bg-base);
		font-size: 16px;
		cursor: pointer;
		transition: opacity var(--transition);
		flex-shrink: 0;
	}

	.send-btn:disabled { opacity: 0.3; cursor: not-allowed; }
	.send-btn:not(:disabled):hover { opacity: 0.8; }
</style>
