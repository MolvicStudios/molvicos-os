<script>
  import { streamAI } from '$lib/ai/stream.js';
  import { createAppHistory } from '$lib/stores/history.js';
  import { exportTXT, exportPDF, copyToClipboard } from '$lib/utils/export.js';
  import { t } from '$lib/i18n/index.js';
  import { onMount, tick } from 'svelte';

  const history = createAppHistory('aiworksuite');

  let activeModule  = 'teams';
  let isGenerating  = false;
  let result        = '';
  let copySuccess   = false;

  // --- AI Teams ---
  let teams = JSON.parse(localStorage.getItem('ms_aiws_teams') || '[]');
  let teamName      = '';
  let teamProject   = '';
  let activeTeam    = null;
  let teamChatInput = '';
  let isDetectingRoles = false;
  let isTeamChatting   = false;
  let chatEl;

  // --- Invoice ---
  let invClient     = '';
  let invServices   = '';
  let invTotal      = '';
  let invCurrency   = 'USD';
  let invDueDate    = '';

  // --- Proposal ---
  let propProject   = '';
  let propClient    = '';
  let propBudget    = '';
  let propTimeline  = '';

  // --- Contract ---
  let ctxProject    = '';
  let ctxClient     = '';
  let ctxRate       = '';
  let ctxScope      = '';

  // --- Time tracking ---
  let timeEntries   = JSON.parse(localStorage.getItem('ms_aiws_time') || '[]');
  let newEntry      = { date: '', description: '', hours: '' };

  // --- Rate calculator ---
  let rateDesiredSalary = '';
  let rateWorkWeeks     = '48';
  let rateHoursPerWeek  = '40';
  let rateOverhead      = '30';
  let rateResult        = null;

  onMount(() => {
    const handler = (e) => {
      if (e.detail?.appId === 'aiworksuite') {
        propProject = e.detail.prompt;
        activeModule = 'proposal';
      }
    };
    window.addEventListener('mira:prompt-suggestion', handler);
    return () => window.removeEventListener('mira:prompt-suggestion', handler);
  });

  async function generate(systemPrompt, userMessage) {
    isGenerating = true;
    result = '';

    await streamAI({
      system:  systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.6,
      action: 'aiworksuite',
      onChunk: (_, full) => { result = full; },
      onDone: (full) => {
        result = full;
        isGenerating = false;
        history.add({ module: activeModule, snippet: full.slice(0, 80) });
      },
      onError: (err) => {
        result = `Error: ${err}`;
        isGenerating = false;
      },
    });
  }

  // --- AI Teams ---
  function persistTeams() {
    localStorage.setItem('ms_aiws_teams', JSON.stringify(teams));
  }

  async function createAITeam() {
    if (!teamName.trim() || !teamProject.trim()) return;

    isDetectingRoles = true;
    let rolesJSON = '';

    await streamAI({
      system: `You are an expert team composition analyst. Given a project description, suggest exactly 5 specialized AI agent roles for a team.
The FIRST role MUST always be "Senior Prompt Engineer" — this agent specializes in crafting optimal prompts and coordinating AI interactions across the team.
Return ONLY a valid JSON array (no markdown fences, no explanation) with exactly 5 objects:
[{"role":"Senior Prompt Engineer","emoji":"🎯","desc":"..."},{"role":"...","emoji":"...","desc":"..."}]
Each object has: role (title), emoji (single relevant emoji), desc (one-sentence description of what this agent does for THIS specific project).
Choose roles that create a complementary team covering all critical aspects of the project.`,
      messages: [{ role: 'user', content: `Project: ${teamProject}` }],
      temperature: 0.4,
      action: 'aiworksuite',
      onChunk: (_, full) => { rolesJSON = full; },
      onDone: (full) => { rolesJSON = full; isDetectingRoles = false; },
      onError: (err) => { isDetectingRoles = false; result = `Error: ${err}`; },
    });

    if (!rolesJSON) return;

    let agents;
    try {
      const match = rolesJSON.match(/\[[\s\S]*\]/);
      agents = match ? JSON.parse(match[0]) : JSON.parse(rolesJSON);
      if (!Array.isArray(agents) || agents.length === 0) throw new Error('invalid');
      agents = agents.slice(0, 5).map((a, i) => ({
        id: `agent-${i}`,
        role: String(a.role || `Agent ${i + 1}`),
        emoji: String(a.emoji || '🤖'),
        desc: String(a.desc || '')
      }));
    } catch {
      agents = [
        { id: 'agent-0', role: 'Senior Prompt Engineer', emoji: '🎯', desc: 'Crafts and optimizes AI prompts for the team' },
        { id: 'agent-1', role: 'Project Manager', emoji: '📋', desc: 'Coordinates tasks and timelines' },
        { id: 'agent-2', role: 'Technical Lead', emoji: '💻', desc: 'Technical architecture and decisions' },
        { id: 'agent-3', role: 'Quality Analyst', emoji: '🔍', desc: 'Reviews quality and standards' },
        { id: 'agent-4', role: 'Strategy Advisor', emoji: '🧠', desc: 'Strategic direction and planning' },
      ];
    }

    const team = {
      id: crypto.randomUUID(),
      name: teamName,
      project: teamProject,
      agents,
      chatHistory: [],
      createdAt: new Date().toISOString()
    };

    teams = [team, ...teams].slice(0, 20);
    persistTeams();
    teamName = '';
    teamProject = '';
    history.add({ module: 'teams', snippet: `Created team: ${team.name}` });
    openTeamChat(team);
  }

  function openTeamChat(team) {
    activeTeam = team;
  }

  function closeTeamChat() {
    activeTeam = null;
  }

  function deleteTeam(id) {
    teams = teams.filter(t => t.id !== id);
    persistTeams();
    if (activeTeam?.id === id) activeTeam = null;
  }

  async function scrollChat() {
    await tick();
    if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;
  }

  function parseAgentResponses(text) {
    const sections = text.split(/<<AGENT:([^>]+)>>\s*/);
    const msgs = [];

    for (let i = 1; i < sections.length; i += 2) {
      const header = sections[i];
      const content = (sections[i + 1] || '').trim();
      if (!content) continue;

      const lastColon = header.lastIndexOf(':');
      const role = lastColon > 0 ? header.slice(0, lastColon).trim() : header.trim();
      const emoji = lastColon > 0 ? header.slice(lastColon + 1).trim() : '🤖';

      msgs.push({
        id: `msg-${Date.now()}-${i}`,
        sender: 'agent',
        agentRole: role,
        agentEmoji: emoji,
        content,
        ts: Date.now()
      });
    }

    if (msgs.length === 0 && text.trim()) {
      msgs.push({
        id: `msg-${Date.now()}-fb`,
        sender: 'agent',
        agentRole: 'Team',
        agentEmoji: '👥',
        content: text.trim(),
        ts: Date.now()
      });
    }

    return msgs;
  }

  async function sendTeamMessage() {
    if (!teamChatInput.trim() || !activeTeam || isTeamChatting) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: teamChatInput.trim(),
      ts: Date.now()
    };

    activeTeam.chatHistory = [...(activeTeam.chatHistory || []), userMsg].slice(-50);
    activeTeam = activeTeam;
    teamChatInput = '';
    isTeamChatting = true;
    scrollChat();

    const agentList = activeTeam.agents.map(a => `- ${a.emoji} ${a.role}: ${a.desc}`).join('\n');

    const recentHistory = (activeTeam.chatHistory || []).slice(-10);
    const conversationMsgs = recentHistory.map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.sender === 'user' ? m.content : `[${m.agentRole || 'Agent'}]: ${m.content}`
    }));

    const systemPrompt = `You are a team of ${activeTeam.agents.length} specialized AI agents working on the project "${activeTeam.project}".

TEAM MEMBERS:
${agentList}

RULES:
- Each relevant agent MUST respond (minimum 2, maximum all ${activeTeam.agents.length}).
- The Senior Prompt Engineer should always respond, coordinating or refining the approach.
- Use this EXACT format for each agent response (critical for parsing):

<<AGENT:Role Name:emoji>>
Response text here.

- Keep each agent's response focused and concise (2-4 sentences).
- Agents can reference or build on other agents' points.
- Stay in character — each agent speaks from their role's perspective.`;

    let fullResponse = '';

    await streamAI({
      system: systemPrompt,
      messages: conversationMsgs,
      temperature: 0.6,
      action: 'aiworksuite',
      onChunk: (_, full) => {
        fullResponse = full;
        activeTeam = { ...activeTeam, _streamingResponse: full };
        scrollChat();
      },
      onDone: (full) => {
        fullResponse = full;
        isTeamChatting = false;

        const agentMsgs = parseAgentResponses(full);
        const updated = { ...activeTeam };
        delete updated._streamingResponse;
        updated.chatHistory = [...(updated.chatHistory || []), ...agentMsgs].slice(-50);

        activeTeam = updated;
        teams = teams.map(t => t.id === activeTeam.id ? activeTeam : t);
        persistTeams();
        history.add({ module: 'teams', snippet: `Team chat: ${activeTeam.name}` });
        scrollChat();
      },
      onError: (err) => {
        isTeamChatting = false;
        const updated = { ...activeTeam };
        delete updated._streamingResponse;
        updated.chatHistory = [...(updated.chatHistory || []), {
          id: `msg-${Date.now()}-err`,
          sender: 'system',
          content: `Error: ${err}`,
          ts: Date.now()
        }];
        activeTeam = updated;
        scrollChat();
      },
    });
  }

  // --- Invoice ---
  function generateInvoice() {
    if (!invClient.trim() || !invServices.trim()) return;
    generate(`You are a professional invoice writer for freelancers.
Generate a clean, professional invoice in plain text format.
Include: Invoice number (auto-generated), Date, Due date, Client info, Itemized services, Subtotal, Tax line (if applicable), Total, Payment instructions.`,
      `Client: ${invClient}\nServices: ${invServices}\nTotal: ${invTotal} ${invCurrency}\nDue: ${invDueDate || '30 days'}`
    );
  }

  function generateProposal() {
    if (!propProject.trim()) return;
    generate(`You are an expert freelance proposal writer.
Generate a professional project proposal with: Executive Summary, Project Understanding,
Proposed Solution, Deliverables, Timeline, Investment (pricing), Why Choose Me section, Next Steps.
Professional but personal tone. Max 600 words.`,
      `Project: ${propProject}\nClient: ${propClient || 'the client'}\nBudget: ${propBudget || 'TBD'}\nTimeline: ${propTimeline || 'TBD'}`
    );
  }

  function generateContract() {
    if (!ctxProject.trim()) return;
    generate(`You are a freelance contract specialist.
Generate a simple but professional freelance contract covering:
Services, Deliverables, Payment Terms, Intellectual Property, Confidentiality, Revisions Policy,
Termination, Limitation of Liability. Use clear language, no legal jargon.`,
      `Project: ${ctxProject}\nClient: ${ctxClient || 'Client'}\nRate: ${ctxRate || 'as agreed'}\nScope: ${ctxScope}`
    );
  }

  function addTimeEntry() {
    if (!newEntry.description || !newEntry.hours) return;
    timeEntries = [{
      id: crypto.randomUUID(),
      date: newEntry.date || new Date().toLocaleDateString(),
      description: newEntry.description,
      hours: parseFloat(newEntry.hours) || 0,
    }, ...timeEntries].slice(0, 100);
    localStorage.setItem('ms_aiws_time', JSON.stringify(timeEntries));
    newEntry = { date: '', description: '', hours: '' };
  }

  function removeEntry(id) {
    timeEntries = timeEntries.filter(e => e.id !== id);
    localStorage.setItem('ms_aiws_time', JSON.stringify(timeEntries));
  }

  $: totalHours = timeEntries.reduce((sum, e) => sum + e.hours, 0);

  async function generateTimeSummary() {
    if (timeEntries.length === 0) return;
    const entries = timeEntries.map(e => `${e.date}: ${e.description} (${e.hours}h)`).join('\n');
    generate(`You are a freelance billing assistant.
Generate a professional time summary report for client billing.
Include total hours, breakdown by type of work, and a billing summary paragraph.`,
      `Time entries:\n${entries}\n\nTotal: ${totalHours.toFixed(1)} hours`
    );
  }

  function calculateRate() {
    const salary   = parseFloat(rateDesiredSalary) || 0;
    const weeks    = parseFloat(rateWorkWeeks) || 48;
    const hours    = parseFloat(rateHoursPerWeek) || 40;
    const overhead = parseFloat(rateOverhead) || 30;
    if (!salary) return;
    const base     = salary / (weeks * hours);
    const withOH   = base * (1 + overhead / 100);
    rateResult = {
      hourly:  Math.ceil(withOH),
      daily:   Math.ceil(withOH * 8),
      weekly:  Math.ceil(withOH * hours),
      monthly: Math.ceil(withOH * hours * (weeks / 12)),
    };
  }

  async function copy() {
    await copyToClipboard(result);
    copySuccess = true;
    setTimeout(() => copySuccess = false, 2000);
  }
</script>

<div class="aiws">

  <div class="aiws-tabs">
    {#each [
      ['teams','👥'],
      ['invoice','🧾'],
      ['proposal','📄'],
      ['contract','📋'],
      ['time','⏱'],
      ['rate','💰'],
    ] as [id, icon]}
      <button class="aiws-tab" class:active={activeModule === id}
        on:click={() => { activeModule = id; result = ''; activeTeam = null; }}>
        {icon} {$t(`apps.aiworksuite.${id}`)}
      </button>
    {/each}
  </div>

  <div class="aiws-body">

    {#if activeModule === 'teams'}
      {#if activeTeam}
        <!-- Team Chat Mode -->
        <div class="team-chat-layout">
          <div class="tch-header">
            <button class="tch-back" on:click={closeTeamChat}>← {$t('apps.aiworksuite.teams')}</button>
            <div class="tch-info">
              <span class="tch-name">👥 {activeTeam.name}</span>
              <span class="tch-project">{activeTeam.project?.slice(0, 100)}</span>
            </div>
          </div>
          <div class="tch-agents-bar">
            {#each activeTeam.agents || [] as agent}
              <div class="agent-chip" title={agent.desc}>{agent.emoji} {agent.role}</div>
            {/each}
          </div>
          <div class="tch-messages" bind:this={chatEl}>
            {#each activeTeam.chatHistory || [] as msg (msg.id)}
              {#if msg.sender === 'user'}
                <div class="msg msg-user">
                  <div class="msg-bubble">{msg.content}</div>
                </div>
              {:else if msg.sender === 'agent'}
                <div class="msg msg-agent">
                  <span class="msg-label">{msg.agentEmoji} {msg.agentRole}</span>
                  <div class="msg-bubble">{msg.content}</div>
                </div>
              {:else}
                <div class="msg msg-system">{msg.content}</div>
              {/if}
            {/each}
            {#if activeTeam._streamingResponse}
              <div class="msg msg-agent">
                <span class="msg-label">👥 Team</span>
                <div class="msg-bubble streaming">{activeTeam._streamingResponse}▋</div>
              </div>
            {/if}
            {#if isTeamChatting && !activeTeam._streamingResponse}
              <div class="msg msg-thinking">
                <span class="loading-glyph">◈</span> {$t('apps.aiworksuite.agentsThinking')}
              </div>
            {/if}
          </div>
          <form class="tch-input" on:submit|preventDefault={sendTeamMessage}>
            <input bind:value={teamChatInput} placeholder={$t('apps.aiworksuite.messageTeam')} disabled={isTeamChatting} />
            <button type="submit" class="tci-send" disabled={isTeamChatting || !teamChatInput.trim()}>➤</button>
          </form>
        </div>
      {:else}
        <!-- Teams List + Create -->
        <div class="teams-view">
          <div class="teams-create">
            <div class="form-field"><label for="aiws-team-name">{$t('apps.aiworksuite.teamName')}</label>
              <input id="aiws-team-name" bind:value={teamName} placeholder="Marketing Team" /></div>
            <div class="form-field"><label for="aiws-team-project">{$t('apps.aiworksuite.teamProject')}</label>
              <textarea id="aiws-team-project" bind:value={teamProject} rows="4" placeholder={$t('apps.aiworksuite.teamProjectPh')}></textarea></div>
            <button class="gen-btn" on:click={createAITeam} disabled={isDetectingRoles || !teamName.trim() || !teamProject.trim()}>
              {isDetectingRoles ? `🔄 ${$t('apps.aiworksuite.detectingRoles')}` : `🤖 ${$t('apps.aiworksuite.createAITeam')} — 1 cr`}
            </button>
          </div>
          <div class="teams-grid">
            {#if teams.length > 0}
              {#each teams as team (team.id)}
                <div class="team-card-v2">
                  <div class="tcv2-header">
                    <span class="tcv2-name">👥 {team.name}</span>
                    <button class="tc-btn-del" on:click|stopPropagation={() => deleteTeam(team.id)} title="Delete">×</button>
                  </div>
                  <div class="tcv2-project">{team.project?.slice(0, 80) || '—'}</div>
                  {#if team.agents?.length}
                    <div class="tcv2-agents">
                      {#each team.agents as agent}
                        <span class="agent-tag" title={agent.desc}>{agent.emoji} {agent.role}</span>
                      {/each}
                    </div>
                  {/if}
                  <button class="tcv2-chat-btn" on:click={() => openTeamChat(team)}>
                    💬 {$t('apps.aiworksuite.openChat')}
                  </button>
                </div>
              {/each}
            {:else}
              <div class="teams-empty">{$t('apps.aiworksuite.teamsEmpty')}</div>
            {/if}
          </div>
        </div>
      {/if}
    {:else}

    <div class="aiws-form">

      {#if activeModule === 'invoice'}
        <div class="form-field"><label for="aiws-inv-client">{$t('apps.aiworksuite.clientName')}</label>
          <input id="aiws-inv-client" bind:value={invClient} placeholder="Acme Corp" /></div>
        <div class="form-field"><label for="aiws-inv-services">{$t('apps.aiworksuite.services')}</label>
          <textarea id="aiws-inv-services" bind:value={invServices} rows="4" placeholder="Web design - 20h @ $80/h&#10;Copywriting - 5h @ $60/h"></textarea></div>
        <div class="form-field"><label for="aiws-inv-total">{$t('apps.aiworksuite.totalAmount')}</label>
          <div style="display:flex;gap:6px">
            <input id="aiws-inv-total" bind:value={invTotal} placeholder="2000" style="flex:1" />
            <select bind:value={invCurrency} style="width:70px">
              {#each ['USD','EUR','GBP','CAD','AUD'] as c}<option>{c}</option>{/each}
            </select>
          </div></div>
        <div class="form-field"><label for="aiws-inv-due">{$t('apps.aiworksuite.dueDate')}</label>
          <input id="aiws-inv-due" bind:value={invDueDate} placeholder="30 days" /></div>
        <button class="gen-btn" on:click={generateInvoice} disabled={isGenerating || !invClient.trim()}>
          {isGenerating ? $t('common.loading') : `🧾 ${$t('apps.aiworksuite.generate')} — 1 cr`}</button>

      {:else if activeModule === 'proposal'}
        <div class="form-field"><label for="aiws-prop-project">{$t('apps.aiworksuite.projectDesc')}</label>
          <textarea id="aiws-prop-project" bind:value={propProject} rows="4" placeholder="Build a landing page for a SaaS product..."></textarea></div>
        <div class="form-field"><label for="aiws-prop-client">{$t('apps.aiworksuite.clientName')}</label>
          <input id="aiws-prop-client" bind:value={propClient} placeholder="Client" /></div>
        <div class="form-field"><label for="aiws-prop-budget">{$t('apps.aiworksuite.budget')}</label>
          <input id="aiws-prop-budget" bind:value={propBudget} placeholder="$2,000 - $4,000" /></div>
        <div class="form-field"><label for="aiws-prop-timeline">{$t('apps.aiworksuite.timeline')}</label>
          <input id="aiws-prop-timeline" bind:value={propTimeline} placeholder="2-3 weeks" /></div>
        <button class="gen-btn" on:click={generateProposal} disabled={isGenerating || !propProject.trim()}>
          {isGenerating ? $t('common.loading') : `📄 ${$t('apps.aiworksuite.generate')} — 1 cr`}</button>

      {:else if activeModule === 'contract'}
        <div class="form-field"><label for="aiws-ctx-project">{$t('apps.aiworksuite.projectScope')}</label>
          <textarea id="aiws-ctx-project" bind:value={ctxProject} rows="3" placeholder="Website redesign including 5 pages..."></textarea></div>
        <div class="form-field"><label for="aiws-ctx-client">{$t('apps.aiworksuite.clientName')}</label>
          <input id="aiws-ctx-client" bind:value={ctxClient} placeholder="Client" /></div>
        <div class="form-field"><label for="aiws-ctx-rate">{$t('apps.aiworksuite.ratePayment')}</label>
          <input id="aiws-ctx-rate" bind:value={ctxRate} placeholder="$3,500 flat / $80/hour" /></div>
        <div class="form-field"><label for="aiws-ctx-scope">{$t('apps.aiworksuite.scopeNotes')}</label>
          <textarea id="aiws-ctx-scope" bind:value={ctxScope} rows="2" placeholder="3 revision rounds included..."></textarea></div>
        <button class="gen-btn" on:click={generateContract} disabled={isGenerating || !ctxProject.trim()}>
          {isGenerating ? $t('common.loading') : `📋 ${$t('apps.aiworksuite.generate')} — 1 cr`}</button>

      {:else if activeModule === 'time'}
        <div class="time-entry-form">
          <input bind:value={newEntry.date} placeholder="Date" style="width:90px" />
          <input bind:value={newEntry.description} placeholder="Description" style="flex:1" />
          <input bind:value={newEntry.hours} placeholder="hrs" style="width:50px" type="number" min="0.5" step="0.5" />
          <button class="add-btn" on:click={addTimeEntry}>+</button>
        </div>
        <div class="time-list">
          {#each timeEntries.slice(0, 15) as e (e.id)}
            <div class="time-row">
              <span class="tr-date">{e.date}</span>
              <span class="tr-desc">{e.description}</span>
              <span class="tr-hours">{e.hours}h</span>
              <button class="tr-del" on:click={() => removeEntry(e.id)}>×</button>
            </div>
          {/each}
        </div>
        <div class="time-total">Total: <strong>{totalHours.toFixed(1)}h</strong></div>
        <button class="gen-btn" on:click={generateTimeSummary} disabled={isGenerating || timeEntries.length === 0}>
          {isGenerating ? $t('common.loading') : `⏱ ${$t('apps.aiworksuite.generate')} — 1 cr`}</button>

      {:else if activeModule === 'rate'}
        <div class="form-field"><label for="aiws-rate-salary">{$t('apps.aiworksuite.annualIncome')}</label>
          <input id="aiws-rate-salary" bind:value={rateDesiredSalary} placeholder="60000" type="number" /></div>
        <div class="form-field"><label for="aiws-rate-weeks">{$t('apps.aiworksuite.billableWeeks')}</label>
          <input id="aiws-rate-weeks" bind:value={rateWorkWeeks} type="number" min="1" max="52" /></div>
        <div class="form-field"><label for="aiws-rate-hours">{$t('apps.aiworksuite.billableHours')}</label>
          <input id="aiws-rate-hours" bind:value={rateHoursPerWeek} type="number" min="1" max="60" /></div>
        <div class="form-field"><label for="aiws-rate-overhead">{$t('apps.aiworksuite.overheadPct')}</label>
          <input id="aiws-rate-overhead" bind:value={rateOverhead} type="number" min="0" max="100" /></div>
        <button class="gen-btn" on:click={calculateRate} disabled={!rateDesiredSalary}>
          💰 {$t('apps.aiworksuite.calculateRate')}</button>
        {#if rateResult}
          <div class="rate-results">
            {#each [['Hourly',rateResult.hourly],['Daily',rateResult.daily],['Weekly',rateResult.weekly],['Monthly',rateResult.monthly]] as [label, val]}
              <div class="rate-card">
                <span class="rc-label">{label}</span>
                <span class="rc-val">${val.toLocaleString()}</span>
              </div>
            {/each}
          </div>
        {/if}
      {/if}

    </div>

    {#if activeModule !== 'rate'}
      <div class="aiws-result">
        {#if result}
          <div class="result-actions">
            <button on:click={copy}>{copySuccess ? '✓' : $t('apps.aiworksuite.copy')}</button>
            <button on:click={() => exportTXT(result, `aiws-${activeModule}.txt`)}>TXT</button>
            <button on:click={() => exportPDF(result, `AIWorkSuite — ${activeModule}`)}>PDF</button>
          </div>
          <pre class="result-text">{result}{isGenerating ? '▋' : ''}</pre>
        {:else if isGenerating}
          <div class="result-loading">
            <span class="loading-glyph">◈</span>
            <span>Generating...</span>
          </div>
        {:else}
          <div class="result-empty">Results will appear here.</div>
        {/if}
      </div>
    {/if}

    {/if}

  </div>
</div>

<style>
  .aiws { display: flex; flex-direction: column; height: 100%; font-family: var(--font-mono); }
  .aiws-tabs { display: flex; border-bottom: 1px solid var(--border); padding: 0 12px; flex-shrink: 0; overflow-x: auto; }
  .aiws-tab {
    background: none; border: none; border-bottom: 2px solid transparent;
    padding: 10px 12px; font-size: 11px; color: var(--text-secondary);
    cursor: pointer; font-family: var(--font-mono); transition: all var(--transition);
    margin-bottom: -1px; white-space: nowrap;
  }
  .aiws-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
  .aiws-body { display: flex; flex: 1; overflow: hidden; }
  .aiws-form { width: 280px; flex-shrink: 0; padding: 14px; overflow-y: auto; border-right: 1px solid var(--border); display: flex; flex-direction: column; gap: 10px; }
  .aiws-result { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

  .form-field { display: flex; flex-direction: column; gap: 5px; }
  .form-field label { font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }
  .gen-btn {
    background: var(--accent); border: none; border-radius: var(--radius-sm);
    color: var(--text-on-accent); font-size: 11px; padding: 9px 14px; cursor: pointer;
    font-family: var(--font-mono); font-weight: 500; margin-top: 4px;
  }
  .gen-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .time-entry-form { display: flex; gap: 5px; align-items: center; }
  .add-btn { background: var(--accent); border: none; border-radius: 4px; color: var(--text-on-accent); font-size: 14px; width: 28px; height: 28px; cursor: pointer; flex-shrink: 0; }
  .time-list { display: flex; flex-direction: column; gap: 4px; max-height: 160px; overflow-y: auto; }
  .time-row { display: flex; align-items: center; gap: 6px; font-size: 10px; padding: 4px 0; border-bottom: 0.5px solid var(--border); }
  .tr-date  { color: var(--text-secondary); width: 70px; flex-shrink: 0; }
  .tr-desc  { flex: 1; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tr-hours { color: var(--accent); width: 30px; text-align: right; flex-shrink: 0; }
  .tr-del   { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 14px; }
  .time-total { font-size: 11px; color: var(--text-secondary); text-align: right; }
  .time-total strong { color: var(--accent); }

  .rate-results { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
  .rate-card { background: var(--bg-input); border-radius: var(--radius-sm); padding: 10px; text-align: center; }
  .rc-label { font-size: 10px; color: var(--text-secondary); display: block; }
  .rc-val   { font-size: 18px; font-weight: 500; color: var(--accent); display: block; }

  .result-actions { display: flex; gap: 6px; padding: 8px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .result-actions button { background: none; border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary); font-size: 10px; padding: 4px 10px; cursor: pointer; font-family: var(--font-mono); }
  .result-actions button:hover { color: var(--accent); border-color: var(--accent-border); }
  .result-text { flex: 1; overflow-y: auto; padding: 14px; font-size: 11px; color: var(--text-primary); white-space: pre-wrap; word-break: break-word; line-height: 1.7; margin: 0; }
  .result-loading, .result-empty { flex: 1; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 10px; color: var(--text-secondary); font-size: 12px; }
  .loading-glyph { font-size: 24px; color: var(--accent); animation: pulse-accent 2s infinite; }

  /* Teams view (list mode) */
  .teams-view { display: flex; flex: 1; overflow: hidden; }
  .teams-create { width: 280px; flex-shrink: 0; padding: 14px; overflow-y: auto; border-right: 1px solid var(--border); display: flex; flex-direction: column; gap: 10px; }
  .teams-grid { flex: 1; padding: 14px; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; align-content: start; }
  .teams-empty { grid-column: 1 / -1; text-align: center; color: var(--text-secondary); font-size: 12px; padding: 40px 0; }

  /* Team card */
  .team-card-v2 { background: var(--bg-input); border-radius: var(--radius-sm); padding: 14px; display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--border); }
  .tcv2-header { display: flex; align-items: center; justify-content: space-between; }
  .tcv2-name { font-size: 12px; font-weight: 600; color: var(--text-primary); }
  .tcv2-project { font-size: 10px; color: var(--text-secondary); line-height: 1.4; }
  .tcv2-agents { display: flex; flex-wrap: wrap; gap: 4px; }
  .agent-tag { font-size: 9px; background: var(--bg-surface, var(--bg-input)); border: 1px solid var(--border); border-radius: 10px; padding: 2px 8px; color: var(--text-secondary); white-space: nowrap; }
  .tc-btn-del { background: none; border: none; color: var(--text-muted); font-size: 16px; cursor: pointer; padding: 2px 6px; line-height: 1; }
  .tc-btn-del:hover { color: #ef4444; }
  .tcv2-chat-btn { background: none; border: 1px solid var(--accent); border-radius: var(--radius-sm); color: var(--accent); font-size: 10px; padding: 6px 12px; cursor: pointer; font-family: var(--font-mono); transition: all var(--transition); margin-top: 2px; }
  .tcv2-chat-btn:hover { background: var(--accent); color: var(--text-on-accent); }

  /* Team chat layout */
  .team-chat-layout { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
  .tch-header { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .tch-back { background: none; border: none; color: var(--accent); font-size: 12px; cursor: pointer; font-family: var(--font-mono); padding: 4px 8px; white-space: nowrap; }
  .tch-back:hover { text-decoration: underline; }
  .tch-info { display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
  .tch-name { font-size: 12px; font-weight: 600; color: var(--text-primary); }
  .tch-project { font-size: 9px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* Agents bar */
  .tch-agents-bar { display: flex; gap: 6px; padding: 8px 14px; border-bottom: 1px solid var(--border); overflow-x: auto; flex-shrink: 0; }
  .agent-chip { font-size: 10px; background: var(--bg-input); border: 1px solid var(--border); border-radius: 12px; padding: 4px 10px; color: var(--text-secondary); white-space: nowrap; cursor: default; }

  /* Chat messages */
  .tch-messages { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
  .msg { max-width: 85%; }
  .msg-user { align-self: flex-end; }
  .msg-user .msg-bubble { background: var(--accent); color: var(--text-on-accent); border-radius: 12px 12px 2px 12px; padding: 8px 12px; font-size: 11px; line-height: 1.5; }
  .msg-agent { align-self: flex-start; display: flex; flex-direction: column; gap: 3px; }
  .msg-label { font-size: 9px; color: var(--text-secondary); font-weight: 500; letter-spacing: 0.5px; }
  .msg-agent .msg-bubble { background: var(--bg-input); color: var(--text-primary); border-radius: 2px 12px 12px 12px; padding: 8px 12px; font-size: 11px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
  .msg-agent .msg-bubble.streaming { opacity: 0.8; }
  .msg-system { align-self: center; font-size: 10px; color: var(--text-muted); padding: 4px 10px; }
  .msg-thinking { align-self: center; font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; padding: 8px; }

  /* Chat input */
  .tch-input { display: flex; gap: 8px; padding: 10px 14px; border-top: 1px solid var(--border); flex-shrink: 0; }
  .tch-input input { flex: 1; background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 8px 12px; font-size: 11px; color: var(--text-primary); font-family: var(--font-mono); }
  .tch-input input:focus { border-color: var(--accent); outline: none; }
  .tci-send { background: var(--accent); border: none; border-radius: var(--radius-sm); color: var(--text-on-accent); font-size: 14px; width: 36px; height: 36px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .tci-send:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
