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

  // --- CRM ---
  const PIPELINE_STAGES = ['new','contacted','qualified','proposal','negotiation','won','lost'];
  const PIPELINE_LABELS = ['crmStageNew','crmStageContacted','crmStageQualified','crmStageProposal','crmStageNegotiation','crmStageWon','crmStageLost'];
  let clients = JSON.parse(localStorage.getItem('ms_aiws_crm_clients') || '[]');
  let showNewClientModal = false;
  let newClient = { name: '', company: '', email: '', phone: '', notes: '', stage: 'new' };
  let activeClient = null;
  let crmChatInput = '';
  let crmChatLoading = false;
  let crmNoteText = '';
  let crmShowNoteModal = false;
  let crmNoteClientId = null;
  let dragStage = null;
  let dragClientId = null;

  // --- CRM helpers ---
  function persistClients() {
    localStorage.setItem('ms_aiws_crm_clients', JSON.stringify(clients));
  }

  function getStageClients(stage) {
    return clients.filter(c => c.stage === stage);
  }

  function openNewClientModal() {
    newClient = { name: '', company: '', email: '', phone: '', notes: '', stage: 'new' };
    showNewClientModal = true;
  }

  function createClient() {
    if (!newClient.name.trim()) return;
    const client = {
      id: crypto.randomUUID(),
      name: newClient.name.trim(),
      company: newClient.company.trim(),
      email: newClient.email.trim(),
      phone: newClient.phone.trim(),
      notes: newClient.notes.trim(),
      stage: newClient.stage || 'new',
      proposals: [],
      chatHistory: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    clients = [client, ...clients];
    persistClients();
    showNewClientModal = false;
  }

  function deleteClient(id) {
    clients = clients.filter(c => c.id !== id);
    persistClients();
    if (activeClient?.id === id) activeClient = null;
  }

  function openClient(client) {
    activeClient = client;
  }

  function closeClient() {
    activeClient = null;
  }

  function moveClient(clientId, toStage) {
    clients = clients.map(c => {
      if (c.id === clientId) {
        return { ...c, stage: toStage, updatedAt: Date.now() };
      }
      return c;
    });
    persistClients();
    if (activeClient?.id === clientId) {
      activeClient = clients.find(c => c.id === clientId);
    }
  }

  function markWon(clientId) {
    moveClient(clientId, 'won');
  }

  function markLost(clientId) {
    moveClient(clientId, 'lost');
  }

  function openNoteModal(clientId) {
    crmNoteClientId = clientId;
    const c = clients.find(x => x.id === clientId);
    crmNoteText = c?.notes || '';
    crmShowNoteModal = true;
  }

  function saveNote() {
    clients = clients.map(c => {
      if (c.id === crmNoteClientId) {
        return { ...c, notes: crmNoteText, updatedAt: Date.now() };
      }
      return c;
    });
    persistClients();
    if (activeClient?.id === crmNoteClientId) {
      activeClient = clients.find(c => c.id === crmNoteClientId);
    }
    crmShowNoteModal = false;
    crmNoteClientId = null;
  }

  // --- CRM drag & drop ---
  function handleDragStart(e, clientId, stage) {
    dragClientId = clientId;
    dragStage = stage;
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e, stage) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e, toStage) {
    e.preventDefault();
    if (dragClientId && toStage !== dragStage) {
      moveClient(dragClientId, toStage);
    }
    dragClientId = null;
    dragStage = null;
  }

  // --- CRM Chat IA ---
  async function sendCrmMessage() {
    if (!crmChatInput.trim() || !activeClient || crmChatLoading) return;

    const userMsg = {
      id: `crm-msg-${Date.now()}`,
      sender: 'user',
      content: crmChatInput.trim(),
      ts: Date.now()
    };

    activeClient.chatHistory = [...(activeClient.chatHistory || []), userMsg].slice(-50);
    activeClient = activeClient;
    const input = crmChatInput.trim();
    crmChatInput = '';
    crmChatLoading = true;

    const stageLabel = $t(`apps.aiworksuite.${PIPELINE_LABELS[PIPELINE_STAGES.indexOf(activeClient.stage)]}`);
    const clientInfo = `Cliente: ${activeClient.name}${activeClient.company ? ` (${activeClient.company})` : ''}\nEtapa: ${stageLabel}\nNotas: ${activeClient.notes || '—'}`;

    const recentHistory = (activeClient.chatHistory || []).slice(-10);
    const conversationMsgs = recentHistory.map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.sender === 'user' ? m.content : m.content
    }));

    let fullResponse = '';

    await streamAI({
      system: `Eres un asistente de ventas experto. Ayudas al usuario a gestionar su relación con clientes.

INFORMACIÓN DEL CLIENTE:
${clientInfo}

Tus funciones:
- Sugerir estrategias para avanzar al cliente en el pipeline
- Ayudar a redactar emails de seguimiento personalizados
- Recomendar acciones según la etapa del pipeline
- Analizar notas del cliente y dar insights
- Sugerir argumentos de venta y objeciones

Sé conciso, práctico y profesional. Responde en el mismo idioma que el usuario.`,
      messages: conversationMsgs,
      temperature: 0.6,
      action: 'aiworksuite',
      onChunk: (_, full) => {
        fullResponse = full;
        activeClient = { ...activeClient, _streamingCrm: full };
      },
      onDone: (full) => {
        fullResponse = full;
        crmChatLoading = false;

        const updated = { ...activeClient };
        delete updated._streamingCrm;
        updated.chatHistory = [...(updated.chatHistory || []), {
          id: `crm-msg-${Date.now()}-ai`,
          sender: 'assistant',
          content: full,
          ts: Date.now()
        }].slice(-50);

        activeClient = updated;
        clients = clients.map(c => c.id === activeClient.id ? activeClient : c);
        persistClients();
        history.add({ module: 'crm', snippet: `Chat: ${activeClient.name}` });
      },
      onError: (err) => {
        crmChatLoading = false;
        const updated = { ...activeClient };
        delete updated._streamingCrm;
        updated.chatHistory = [...(updated.chatHistory || []), {
          id: `crm-msg-${Date.now()}-err`,
          sender: 'system',
          content: `Error: ${err}`,
          ts: Date.now()
        }];
        activeClient = updated;
      },
    });
  }

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
      ['crm','📊'],
      ['teams','👥'],
      ['invoice','🧾'],
      ['proposal','📄'],
      ['contract','📋'],
      ['time','⏱'],
      ['rate','💰'],
    ] as [id, icon]}
      <button class="aiws-tab" class:active={activeModule === id}
        on:click={() => { activeModule = id; result = ''; activeTeam = null; activeClient = null; }}>
        {icon} {$t(`apps.aiworksuite.${id}`)}
      </button>
    {/each}
  </div>

  <div class="aiws-body">

    {#if activeModule === 'crm'}
      <!-- CRM Module -->
      {#if activeClient}
        <!-- Client Detail View -->
        <div class="crm-detail">
          <div class="crm-detail-header">
            <button class="crm-back-btn" on:click={closeClient}>← {$t('apps.aiworksuite.crmPipeline')}</button>
            <div class="crm-detail-info">
              <span class="crm-detail-name">{activeClient.name}</span>
              {#if activeClient.company}
                <span class="crm-detail-company">{activeClient.company}</span>
              {/if}
            </div>
            <div class="crm-detail-actions">
              <button class="crm-btn crm-btn-success" on:click={() => markWon(activeClient.id)} title={$t('apps.aiworksuite.crmMarkWon')}>✅</button>
              <button class="crm-btn crm-btn-danger" on:click={() => markLost(activeClient.id)} title={$t('apps.aiworksuite.crmMarkLost')}>❌</button>
              <button class="crm-btn" on:click={() => openNoteModal(activeClient.id)} title={$t('apps.aiworksuite.crmAddNote')}>📝</button>
              <button class="crm-btn crm-btn-del" on:click={() => { deleteClient(activeClient.id); }} title={$t('apps.aiworksuite.crmDeleteConfirm')}>🗑</button>
            </div>
          </div>

          <div class="crm-detail-body">
            <div class="crm-detail-info-panel">
              <div class="crm-info-row"><span class="crm-info-label">{$t('apps.aiworksuite.crmClientName')}</span><span>{activeClient.name}</span></div>
              {#if activeClient.company}<div class="crm-info-row"><span class="crm-info-label">{$t('apps.aiworksuite.crmClientCompany')}</span><span>{activeClient.company}</span></div>{/if}
              {#if activeClient.email}<div class="crm-info-row"><span class="crm-info-label">{$t('apps.aiworksuite.crmClientEmail')}</span><span>{activeClient.email}</span></div>{/if}
              {#if activeClient.phone}<div class="crm-info-row"><span class="crm-info-label">{$t('apps.aiworksuite.crmClientPhone')}</span><span>{activeClient.phone}</span></div>{/if}
              <div class="crm-info-row"><span class="crm-info-label">{$t('apps.aiworksuite.crmPipeline')}</span><span class="crm-stage-badge stage-{activeClient.stage}">{$t(`apps.aiworksuite.${PIPELINE_LABELS[PIPELINE_STAGES.indexOf(activeClient.stage)]}`)}</span></div>
              {#if activeClient.notes}
                <div class="crm-notes-section">
                  <span class="crm-info-label">{$t('apps.aiworksuite.crmClientNotes')}</span>
                  <p class="crm-notes-text">{activeClient.notes}</p>
                </div>
              {/if}
            </div>

            <div class="crm-detail-chat">
              <div class="crm-chat-header">💬 {$t('apps.aiworksuite.crmChatTitle')}</div>
              <div class="crm-chat-msgs" bind:this={chatEl}>
                {#each activeClient.chatHistory || [] as msg (msg.id)}
                  {#if msg.sender === 'user'}
                    <div class="crm-msg crm-msg-user">
                      <div class="crm-msg-bubble">{msg.content}</div>
                    </div>
                  {:else if msg.sender === 'assistant'}
                    <div class="crm-msg crm-msg-ai">
                      <div class="crm-msg-bubble">{msg.content}</div>
                    </div>
                  {:else}
                    <div class="crm-msg crm-msg-system">{msg.content}</div>
                  {/if}
                {/each}
                {#if activeClient._streamingCrm}
                  <div class="crm-msg crm-msg-ai">
                    <div class="crm-msg-bubble streaming">{activeClient._streamingCrm}▋</div>
                  </div>
                {/if}
                {#if crmChatLoading && !activeClient._streamingCrm}
                  <div class="crm-msg crm-msg-thinking">
                    <span class="loading-glyph">◈</span> Pensando...
                  </div>
                {/if}
              </div>
              <form class="crm-chat-input" on:submit|preventDefault={sendCrmMessage}>
                <input bind:value={crmChatInput} placeholder={$t('apps.aiworksuite.crmChatPlaceholder')} disabled={crmChatLoading} />
                <button type="submit" disabled={crmChatLoading || !crmChatInput.trim()}>➤</button>
              </form>
            </div>
          </div>
        </div>
      {:else}
        <!-- Pipeline View -->
        <div class="crm-pipeline">
          <div class="crm-pipeline-header">
            <h3 class="crm-pipeline-title">📊 {$t('apps.aiworksuite.crmPipeline')}</h3>
            <button class="crm-add-btn" on:click={openNewClientModal}>+ {$t('apps.aiworksuite.crmNewClient')}</button>
          </div>
          <div class="crm-columns">
            {#each PIPELINE_STAGES as stage, i}
              <div class="crm-column"
                on:dragover={(e) => handleDragOver(e, stage)}
                on:drop={(e) => handleDrop(e, stage)}>
                <div class="crm-column-header stage-{stage}">
                  <span>{$t(`apps.aiworksuite.${PIPELINE_LABELS[i]}`)}</span>
                  <span class="crm-count">{getStageClients(stage).length}</span>
                </div>
                <div class="crm-column-body">
                  {#each getStageClients(stage) as client (client.id)}
                    <div class="crm-card"
                      draggable="true"
                      on:dragstart={(e) => handleDragStart(e, client.id, stage)}
                      on:click={() => openClient(client)}>
                      <div class="crm-card-name">{client.name}</div>
                      {#if client.company}
                        <div class="crm-card-company">{client.company}</div>
                      {/if}
                      {#if client.email || client.phone}
                        <div class="crm-card-contact">{client.email || client.phone}</div>
                      {/if}
                      <div class="crm-card-actions">
                        <button class="crm-card-btn" on:click|stopPropagation={() => openNoteModal(client.id)} title={$t('apps.aiworksuite.crmAddNote')}>📝</button>
                        <button class="crm-card-btn" on:click|stopPropagation={() => moveClient(client.id, PIPELINE_STAGES[Math.min(i + 1, PIPELINE_STAGES.length - 3)])} title="Avanzar">➡️</button>
                      </div>
                    </div>
                  {:else}
                    <div class="crm-column-empty">—</div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

    {:else if activeModule === 'teams'}
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
              <div class="teams-empty">{$t('apps.aiworksuite.noTeams')}</div>
            {/if}
          </div>
        </div>
      {/if}

    {:else if activeModule === 'invoice'}
      <!-- Invoice Module -->
      <div class="module-panel">
        <h3 class="module-title">🧾 {$t('apps.aiworksuite.invoice')}</h3>
        <div class="form-field"><label for="aiws-inv-client">{$t('apps.aiworksuite.invClient')}</label>
          <input id="aiws-inv-client" bind:value={invClient} placeholder="Acme Corp" /></div>
        <div class="form-field"><label for="aiws-inv-services">{$t('apps.aiworksuite.invServices')}</label>
          <textarea id="aiws-inv-services" bind:value={invServices} rows="3" placeholder="Web development, consulting..." /></div>
        <div class="form-row">
          <div class="form-field"><label for="aiws-inv-total">{$t('apps.aiworksuite.invTotal')}</label>
            <input id="aiws-inv-total" bind:value={invTotal} placeholder="2500" type="number" /></div>
          <div class="form-field"><label for="aiws-inv-currency">{$t('apps.aiworksuite.invCurrency')}</label>
            <select id="aiws-inv-currency" bind:value={invCurrency}>
              <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
            </select></div>
        </div>
        <div class="form-field"><label for="aiws-inv-due">{$t('apps.aiworksuite.invDueDate')}</label>
          <input id="aiws-inv-due" bind:value={invDueDate} placeholder="30 days" /></div>
        <button class="gen-btn" on:click={generateInvoice} disabled={isGenerating || !invClient.trim() || !invServices.trim()}>
          {isGenerating ? `🔄 {$t('apps.aiworksuite.generating')}` : `🧾 {$t('apps.aiworksuite.generateInvoice')} — 1 cr`}
        </button>
      </div>

    {:else if activeModule === 'proposal'}
      <!-- Proposal Module -->
      <div class="module-panel">
        <h3 class="module-title">📄 {$t('apps.aiworksuite.proposal')}</h3>
        <div class="form-field"><label for="aiws-prop-project">{$t('apps.aiworksuite.propProject')}</label>
          <textarea id="aiws-prop-project" bind:value={propProject} rows="3" placeholder="E-commerce platform with AI recommendations..." /></div>
        <div class="form-field"><label for="aiws-prop-client">{$t('apps.aiworksuite.propClient')}</label>
          <input id="aiws-prop-client" bind:value={propClient} placeholder="Client name" /></div>
        <div class="form-row">
          <div class="form-field"><label for="aiws-prop-budget">{$t('apps.aiworksuite.propBudget')}</label>
            <input id="aiws-prop-budget" bind:value={propBudget} placeholder="$5,000–$8,000" /></div>
          <div class="form-field"><label for="aiws-prop-timeline">{$t('apps.aiworksuite.propTimeline')}</label>
            <input id="aiws-prop-timeline" bind:value={propTimeline} placeholder="6 weeks" /></div>
        </div>
        <button class="gen-btn" on:click={generateProposal} disabled={isGenerating || !propProject.trim()}>
          {isGenerating ? `🔄 {$t('apps.aiworksuite.generating')}` : `📄 {$t('apps.aiworksuite.generateProposal')} — 1 cr`}
        </button>
      </div>

    {:else if activeModule === 'contract'}
      <!-- Contract Module -->
      <div class="module-panel">
        <h3 class="module-title">📋 {$t('apps.aiworksuite.contract')}</h3>
        <div class="form-field"><label for="aiws-ctx-project">{$t('apps.aiworksuite.ctxProject')}</label>
          <textarea id="aiws-ctx-project" bind:value={ctxProject} rows="3" placeholder="Mobile app development project..." /></div>
        <div class="form-field"><label for="aiws-ctx-client">{$t('apps.aiworksuite.ctxClient')}</label>
          <input id="aiws-ctx-client" bind:value={ctxClient} placeholder="Client name" /></div>
        <div class="form-row">
          <div class="form-field"><label for="aiws-ctx-rate">{$t('apps.aiworksuite.ctxRate')}</label>
            <input id="aiws-ctx-rate" bind:value={ctxRate} placeholder="$150/hr" /></div>
          <div class="form-field"><label for="aiws-ctx-scope">{$t('apps.aiworksuite.ctxScope')}</label>
            <input id="aiws-ctx-scope" bind:value={ctxScope} placeholder="Full-stack development" /></div>
        </div>
        <button class="gen-btn" on:click={generateContract} disabled={isGenerating || !ctxProject.trim()}>
          {isGenerating ? `🔄 ${$t('apps.aiworksuite.generating')}` : `📋 ${$t('apps.aiworksuite.generateContract')} — 1 cr`}
        </button>
      </div>

    {:else if activeModule === 'time'}
      <!-- Time Tracking Module -->
      <div class="module-panel">
        <h3 class="module-title">⏱ {$t('apps.aiworksuite.time')}</h3>
        <div class="time-form">
          <div class="form-row">
            <div class="form-field"><label for="aiws-time-date">{$t('apps.aiworksuite.timeDate')}</label>
              <input id="aiws-time-date" bind:value={newEntry.date} type="date" /></div>
            <div class="form-field"><label for="aiws-time-hours">{$t('apps.aiworksuite.timeHours')}</label>
              <input id="aiws-time-hours" bind:value={newEntry.hours} type="number" step="0.5" placeholder="2.5" /></div>
          </div>
          <div class="form-field"><label for="aiws-time-desc">{$t('apps.aiworksuite.timeDesc')}</label>
            <input id="aiws-time-desc" bind:value={newEntry.description} placeholder="UI design, client meeting..." /></div>
          <button class="gen-btn" on:click={addTimeEntry} disabled={!newEntry.description || !newEntry.hours}>
            + {$t('apps.aiworksuite.addEntry')}
          </button>
        </div>
        {#if timeEntries.length > 0}
          <div class="time-list">
            <div class="time-summary">{$t('apps.aiworksuite.totalHours')}: <strong>{totalHours.toFixed(1)}h</strong></div>
            {#each timeEntries as entry (entry.id)}
              <div class="time-entry">
                <span class="te-date">{entry.date}</span>
                <span class="te-desc">{entry.description}</span>
                <span class="te-hours">{entry.hours}h</span>
                <button class="te-del" on:click={() => removeEntry(entry.id)}>×</button>
              </div>
            {/each}
            <button class="gen-btn" on:click={generateTimeSummary} disabled={isGenerating}>
              {isGenerating ? `🔄 ${$t('apps.aiworksuite.generating')}` : `📊 ${$t('apps.aiworksuite.generateSummary')} — 1 cr`}
            </button>
          </div>
        {/if}
      </div>

    {:else if activeModule === 'rate'}
      <!-- Rate Calculator Module -->
      <div class="module-panel">
        <h3 class="module-title">💰 {$t('apps.aiworksuite.rate')}</h3>
        <div class="form-field"><label for="aiws-rate-salary">{$t('apps.aiworksuite.rateDesiredSalary')}</label>
          <input id="aiws-rate-salary" bind:value={rateDesiredSalary} type="number" placeholder="60000" /></div>
        <div class="form-row">
          <div class="form-field"><label for="aiws-rate-weeks">{$t('apps.aiworksuite.rateWorkWeeks')}</label>
            <input id="aiws-rate-weeks" bind:value={rateWorkWeeks} type="number" placeholder="48" /></div>
          <div class="form-field"><label for="aiws-rate-hpw">{$t('apps.aiworksuite.rateHoursPerWeek')}</label>
            <input id="aiws-rate-hpw" bind:value={rateHoursPerWeek} type="number" placeholder="40" /></div>
        </div>
        <div class="form-field"><label for="aiws-rate-overhead">{$t('apps.aiworksuite.rateOverhead')} (%)</label>
          <input id="aiws-rate-overhead" bind:value={rateOverhead} type="number" placeholder="30" /></div>
        <button class="gen-btn" on:click={calculateRate} disabled={!rateDesiredSalary}>
          💰 {$t('apps.aiworksuite.calculateRate')}
        </button>
        {#if rateResult}
          <div class="rate-result">
            <div class="rr-item"><span>{$t('apps.aiworksuite.rateHourly')}</span><strong>${rateResult.hourly}/h</strong></div>
            <div class="rr-item"><span>{$t('apps.aiworksuite.rateDaily')}</span><strong>${rateResult.daily}/d</strong></div>
            <div class="rr-item"><span>{$t('apps.aiworksuite.rateWeekly')}</span><strong>${rateResult.weekly}/w</strong></div>
            <div class="rr-item"><span>{$t('apps.aiworksuite.rateMonthly')}</span><strong>${rateResult.monthly}/m</strong></div>
          </div>
        {/if}
      </div>
    {/if}

    {#if result}
      <div class="result-panel">
        <div class="result-header">
          <span>{$t('apps.aiworksuite.result')}</span>
          <div class="result-actions">
            <button class="rh-action" on:click={copy} title={$t('apps.aiworksuite.copyResult')}>
              {copySuccess ? '✅' : '📋'}
            </button>
            <button class="rh-action" on:click={() => exportTXT(result, `aiws-${activeModule}-${Date.now()}`)} title={$t('apps.aiworksuite.exportTxt')}>💾</button>
            <button class="rh-action" on:click={() => exportPDF(result, `aiws-${activeModule}-${Date.now()}`)} title={$t('apps.aiworksuite.exportPdf')}>📕</button>
          </div>
        </div>
        <pre class="result-content">{result}</pre>
      </div>
    {/if}
  </div>

  <!-- New Client Modal -->
  {#if showNewClientModal}
    <div class="modal-overlay" on:click={() => showNewClientModal = false}>
      <div class="modal" on:click|stopPropagation>
        <h3>{$t('apps.aiworksuite.crmNewClient')}</h3>
        <div class="form-field"><label>{$t('apps.aiworksuite.crmClientName')}</label>
          <input bind:value={newClient.name} placeholder="John Doe" /></div>
        <div class="form-field"><label>{$t('apps.aiworksuite.crmClientCompany')}</label>
          <input bind:value={newClient.company} placeholder="Acme Inc" /></div>
        <div class="form-field"><label>{$t('apps.aiworksuite.crmClientEmail')}</label>
          <input bind:value={newClient.email} type="email" placeholder="john@acme.com" /></div>
        <div class="form-field"><label>{$t('apps.aiworksuite.crmClientPhone')}</label>
          <input bind:value={newClient.phone} type="tel" placeholder="+1 555-0123" /></div>
        <div class="form-field"><label>{$t('apps.aiworksuite.crmClientNotes')}</label>
          <textarea bind:value={newClient.notes} rows="3" placeholder="Initial notes about this client..." /></div>
        <div class="modal-actions">
          <button class="gen-btn" on:click={createClient}>✅ {$t('apps.aiworksuite.crmNewClient')}</button>
          <button class="cancel-btn" on:click={() => showNewClientModal = false}>{$t('apps.aiworksuite.cancel')}</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Note Modal -->
  {#if crmShowNoteModal}
    <div class="modal-overlay" on:click={() => crmShowNoteModal = false}>
      <div class="modal" on:click|stopPropagation>
        <h3>{$t('apps.aiworksuite.crmAddNote')}</h3>
        <div class="form-field">
          <textarea bind:value={crmNoteText} rows="5" placeholder="Write notes about this client..." style="width:100%" />
        </div>
        <div class="modal-actions">
          <button class="gen-btn" on:click={saveNote}>💾 {$t('apps.aiworksuite.crmSaveNote')}</button>
          <button class="cancel-btn" on:click={() => crmShowNoteModal = false}>{$t('apps.aiworksuite.cancel')}</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .aiws { display:flex; flex-direction:column; height:100%; gap:0; overflow:hidden; }
  .aiws-tabs { display:flex; gap:2px; padding:8px 8px 0; background:var(--bg2); border-bottom:1px solid var(--border); flex-shrink:0; overflow-x:auto; }
  .aiws-tab { padding:6px 14px; font-size:12px; background:transparent; border:1px solid transparent; border-bottom:none; border-radius:6px 6px 0 0; cursor:pointer; color:var(--text2); white-space:nowrap; transition:background .15s,color .15s; font-family:inherit; }
  .aiws-tab:hover { background:var(--bg3); color:var(--text); }
  .aiws-tab.active { background:var(--bg1); color:var(--accent); border-color:var(--border); font-weight:600; }
  .aiws-body { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:12px; }
  .module-panel { background:var(--bg2); border:1px solid var(--border); border-radius:8px; padding:16px; display:flex; flex-direction:column; gap:10px; }
  .module-title { margin:0 0 4px; font-size:14px; font-weight:600; color:var(--text); }
  .form-field { display:flex; flex-direction:column; gap:3px; flex:1; }
  .form-field label { font-size:11px; font-weight:600; color:var(--text2); text-transform:uppercase; letter-spacing:.04em; }
  .form-field input,.form-field textarea,.form-field select { padding:7px 10px; font-size:13px; background:var(--bg3); border:1px solid var(--border); border-radius:6px; color:var(--text); font-family:inherit; outline:none; transition:border-color .15s; }
  .form-field input:focus,.form-field textarea:focus,.form-field select:focus { border-color:var(--accent); }
  .form-row { display:flex; gap:10px; }
  .gen-btn { padding:8px 16px; font-size:12px; font-weight:600; background:var(--accent); color:#fff; border:none; border-radius:6px; cursor:pointer; transition:opacity .15s; font-family:inherit; align-self:flex-start; }
  .gen-btn:hover { opacity:.85; }
  .gen-btn:disabled { opacity:.4; cursor:not-allowed; }
  .cancel-btn { padding:8px 16px; font-size:12px; background:var(--bg3); color:var(--text2); border:1px solid var(--border); border-radius:6px; cursor:pointer; font-family:inherit; }
  .cancel-btn:hover { background:var(--bg1); }
  .result-panel { background:var(--bg2); border:1px solid var(--border); border-radius:8px; overflow:hidden; }
  .result-header { display:flex; justify-content:space-between; align-items:center; padding:8px 12px; font-size:11px; font-weight:600; color:var(--text2); text-transform:uppercase; letter-spacing:.04em; background:var(--bg3); border-bottom:1px solid var(--border); }
  .result-actions { display:flex; gap:4px; }
  .rh-action { padding:3px 8px; font-size:13px; background:transparent; border:1px solid var(--border); border-radius:4px; cursor:pointer; color:var(--text2); transition:background .15s; }
  .rh-action:hover { background:var(--bg1); }
  .result-content { padding:12px; font-size:12px; line-height:1.6; white-space:pre-wrap; word-break:break-word; color:var(--text); margin:0; max-height:300px; overflow-y:auto; }
  .teams-view { display:flex; flex-direction:column; gap:16px; }
  .teams-create { background:var(--bg2); border:1px solid var(--border); border-radius:8px; padding:16px; display:flex; flex-direction:column; gap:10px; }
  .teams-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:10px; }
  .team-card-v2 { background:var(--bg2); border:1px solid var(--border); border-radius:8px; padding:12px; display:flex; flex-direction:column; gap:6px; }
  .tcv2-header { display:flex; justify-content:space-between; align-items:center; }
  .tcv2-name { font-weight:600; font-size:13px; color:var(--text); }
  .tc-btn-del { background:transparent; border:none; color:var(--text3); cursor:pointer; font-size:16px; padding:0 4px; line-height:1; }
  .tc-btn-del:hover { color:#e74c3c; }
  .tcv2-project { font-size:11px; color:var(--text2); }
  .tcv2-agents { display:flex; flex-wrap:wrap; gap:4px; }
  .agent-tag { font-size:10px; padding:2px 6px; background:var(--bg3); border:1px solid var(--border); border-radius:4px; color:var(--text2); }
  .tcv2-chat-btn { padding:5px 10px; font-size:11px; background:var(--accent); color:#fff; border:none; border-radius:5px; cursor:pointer; font-family:inherit; align-self:flex-start; transition:opacity .15s; }
  .tcv2-chat-btn:hover { opacity:.85; }
  .teams-empty { grid-column:1/-1; text-align:center; padding:40px 20px; color:var(--text3); font-size:13px; }
  .team-chat-layout { display:flex; flex-direction:column; height:100%; background:var(--bg2); border:1px solid var(--border); border-radius:8px; overflow:hidden; }
  .tch-header { display:flex; align-items:center; gap:10px; padding:10px 12px; background:var(--bg3); border-bottom:1px solid var(--border); }
  .tch-back { background:transparent; border:none; color:var(--accent); cursor:pointer; font-size:13px; font-family:inherit; }
  .tch-info { display:flex; flex-direction:column; gap:2px; }
  .tch-name { font-weight:600; font-size:13px; color:var(--text); }
  .tch-project { font-size:11px; color:var(--text3); }
  .tch-agents-bar { display:flex; gap:4px; padding:6px 12px; background:var(--bg1); border-bottom:1px solid var(--border); overflow-x:auto; }
  .agent-chip { font-size:10px; padding:3px 8px; background:var(--bg3); border:1px solid var(--border); border-radius:12px; color:var(--text2); white-space:nowrap; }
  .tch-messages { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:10px; }
  .msg { display:flex; flex-direction:column; gap:3px; }
  .msg-user { align-items:flex-end; }
  .msg-agent { align-items:flex-start; }
  .msg-label { font-size:10px; font-weight:600; color:var(--text3); }
  .msg-bubble { max-width:85%; padding:8px 12px; font-size:12px; line-height:1.5; border-radius:8px; background:var(--bg3); border:1px solid var(--border); color:var(--text); }
  .msg-user .msg-bubble { background:var(--accent); color:#fff; border-color:var(--accent); }
  .msg-system { text-align:center; font-size:11px; color:var(--text3); padding:4px; }
  .msg-thinking { text-align:center; font-size:11px; color:var(--text3); padding:8px; }
  .loading-glyph { display:inline-block; animation:spin 1s linear infinite; }
  @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
  .streaming { opacity:.8; }
  .tch-input { display:flex; gap:6px; padding:8px 12px; border-top:1px solid var(--border); background:var(--bg3); }
  .tch-input input { flex:1; padding:7px 10px; font-size:12px; background:var(--bg1); border:1px solid var(--border); border-radius:6px; color:var(--text); font-family:inherit; outline:none; }
  .tch-input input:focus { border-color:var(--accent); }
  .tci-send { padding:7px 14px; font-size:14px; background:var(--accent); color:#fff; border:none; border-radius:6px; cursor:pointer; transition:opacity .15s; }
  .tci-send:hover { opacity:.85; }
  .tci-send:disabled { opacity:.4; cursor:not-allowed; }
  .time-form { display:flex; flex-direction:column; gap:10px; }
  .time-list { display:flex; flex-direction:column; gap:6px; margin-top:8px; }
  .time-summary { font-size:12px; color:var(--text2); padding:6px 0; border-bottom:1px solid var(--border); }
  .time-entry { display:flex; align-items:center; gap:8px; padding:6px 8px; font-size:12px; background:var(--bg3); border:1px solid var(--border); border-radius:5px; }
  .te-date { color:var(--text3); min-width:80px; font-size:11px; }
  .te-desc { flex:1; color:var(--text); }
  .te-hours { font-weight:600; color:var(--accent); min-width:50px; text-align:right; }
  .te-del { background:transparent; border:none; color:var(--text3); cursor:pointer; font-size:14px; padding:0 4px; }
  .te-del:hover { color:#e74c3c; }
  .rate-result { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px; }
  .rr-item { display:flex; flex-direction:column; gap:2px; padding:10px; background:var(--bg3); border:1px solid var(--border); border-radius:6px; text-align:center; }
  .rr-item span { font-size:10px; color:var(--text3); text-transform:uppercase; letter-spacing:.04em; }
  .rr-item strong { font-size:16px; color:var(--accent); }
  .crm-pipeline { display:flex; flex-direction:column; gap:10px; height:100%; }
  .crm-pipeline-header { display:flex; justify-content:space-between; align-items:center; flex-shrink:0; }
  .crm-pipeline-title { margin:0; font-size:14px; font-weight:600; color:var(--text); }
  .crm-add-btn { padding:6px 14px; font-size:12px; font-weight:600; background:var(--accent); color:#fff; border:none; border-radius:6px; cursor:pointer; font-family:inherit; transition:opacity .15s; }
  .crm-add-btn:hover { opacity:.85; }
  .crm-columns { display:flex; gap:8px; flex:1; overflow-x:auto; padding-bottom:8px; }
  .crm-column { min-width:180px; max-width:220px; flex:1; display:flex; flex-direction:column; background:var(--bg2); border:1px solid var(--border); border-radius:8px; overflow:hidden; }
  .crm-column-header { padding:8px 10px; font-size:11px; font-weight:600; display:flex; justify-content:space-between; align-items:center; color:var(--text); border-bottom:1px solid var(--border); }
  .crm-column-header.stage-new { background:rgba(100,150,255,.12); border-left:3px solid #6496ff; }
  .crm-column-header.stage-contacted { background:rgba(100,200,255,.12); border-left:3px solid #64c8ff; }
  .crm-column-header.stage-qualified { background:rgba(100,255,200,.12); border-left:3px solid #64ffc8; }
  .crm-column-header.stage-proposal { background:rgba(200,200,100,.12); border-left:3px solid #c8c864; }
  .crm-column-header.stage-negotiation { background:rgba(255,180,100,.12); border-left:3px solid #ffb464; }
  .crm-column-header.stage-won { background:rgba(100,255,100,.12); border-left:3px solid #64ff64; }
  .crm-column-header.stage-lost { background:rgba(255,100,100,.12); border-left:3px solid #ff6464; }
  .crm-count { font-size:10px; padding:2px 7px; background:var(--bg3); border-radius:10px; color:var(--text2); }
  .crm-column-body { flex:1; padding:6px; display:flex; flex-direction:column; gap:6px; overflow-y:auto; min-height:100px; }
  .crm-card { padding:8px 10px; background:var(--bg3); border:1px solid var(--border); border-radius:6px; cursor:grab; transition:box-shadow .15s,transform .1s; display:flex; flex-direction:column; gap:3px; }
  .crm-card:hover { box-shadow:0 2px 8px rgba(0,0,0,.12); transform:translateY(-1px); }
  .crm-card:active { cursor:grabbing; }
  .crm-card-name { font-size:12px; font-weight:600; color:var(--text); }
  .crm-card-company { font-size:10px; color:var(--text3); }
  .crm-card-contact { font-size:10px; color:var(--text2); }
  .crm-card-actions { display:flex; gap:4px; margin-top:4px; }
  .crm-card-btn { padding:2px 6px; font-size:11px; background:transparent; border:1px solid var(--border); border-radius:4px; cursor:pointer; transition:background .15s; }
  .crm-card-btn:hover { background:var(--bg1); }
  .crm-column-empty { text-align:center; color:var(--text3); font-size:11px; padding:20px 0; }
  .crm-detail { display:flex; flex-direction:column; height:100%; background:var(--bg2); border:1px solid var(--border); border-radius:8px; overflow:hidden; }
  .crm-detail-header { display:flex; align-items:center; gap:10px; padding:10px 12px; background:var(--bg3); border-bottom:1px solid var(--border); }
  .crm-back-btn { background:transparent; border:none; color:var(--accent); cursor:pointer; font-size:12px; font-family:inherit; white-space:nowrap; }
  .crm-detail-info { flex:1; display:flex; flex-direction:column; gap:2px; }
  .crm-detail-name { font-weight:600; font-size:14px; color:var(--text); }
  .crm-detail-company { font-size:11px; color:var(--text3); }
  .crm-detail-actions { display:flex; gap:4px; }
  .crm-btn { padding:4px 8px; font-size:13px; background:transparent; border:1px solid var(--border); border-radius:5px; cursor:pointer; transition:background .15s; }
  .crm-btn:hover { background:var(--bg1); }
  .crm-btn-success:hover { background:rgba(100,255,100,.15); }
  .crm-btn-danger:hover { background:rgba(255,100,100,.15); }
  .crm-btn-del:hover { background:rgba(255,100,100,.15); }
  .crm-detail-body { display:flex; flex:1; overflow:hidden; }
  .crm-detail-info-panel { width:240px; flex-shrink:0; padding:12px; border-right:1px solid var(--border); display:flex; flex-direction:column; gap:8px; overflow-y:auto; }
  .crm-info-row { display:flex; flex-direction:column; gap:2px; }
  .crm-info-label { font-size:10px; font-weight:600; color:var(--text3); text-transform:uppercase; letter-spacing:.04em; }
  .crm-stage-badge { display:inline-block; padding:2px 8px; font-size:11px; font-weight:600; border-radius:4px; }
  .crm-stage-badge.stage-new { background:rgba(100,150,255,.2); color:#6496ff; }
  .crm-stage-badge.stage-contacted { background:rgba(100,200,255,.2); color:#64c8ff; }
  .crm-stage-badge.stage-qualified { background:rgba(100,255,200,.2); color:#2ecc71; }
  .crm-stage-badge.stage-proposal { background:rgba(200,200,100,.2); color:#c8c864; }
  .crm-stage-badge.stage-negotiation { background:rgba(255,180,100,.2); color:#ffb464; }
  .crm-stage-badge.stage-won { background:rgba(100,255,100,.2); color:#27ae60; }
  .crm-stage-badge.stage-lost { background:rgba(255,100,100,.2); color:#e74c3c; }
  .crm-notes-section { display:flex; flex-direction:column; gap:4px; }
  .crm-notes-text { font-size:12px; color:var(--text2); margin:0; line-height:1.5; white-space:pre-wrap; }
  .crm-detail-chat { flex:1; display:flex; flex-direction:column; overflow:hidden; }
  .crm-chat-header { padding:8px 12px; font-size:12px; font-weight:600; color:var(--text2); border-bottom:1px solid var(--border); background:var(--bg3); }
  .crm-chat-msgs { flex:1; overflow-y:auto; padding:10px; display:flex; flex-direction:column; gap:8px; }
  .crm-msg { display:flex; flex-direction:column; gap:2px; }
  .crm-msg-user { align-items:flex-end; }
  .crm-msg-ai { align-items:flex-start; }
  .crm-msg-bubble { max-width:85%; padding:7px 11px; font-size:12px; line-height:1.5; border-radius:8px; background:var(--bg3); border:1px solid var(--border); color:var(--text); }
  .crm-msg-user .crm-msg-bubble { background:var(--accent); color:#fff; border-color:var(--accent); }
  .crm-msg-system { text-align:center; font-size:11px; color:var(--text3); padding:4px; }
  .crm-msg-thinking { text-align:center; font-size:11px; color:var(--text3); padding:8px; }
  .crm-chat-input { display:flex; gap:6px; padding:8px 10px; border-top:1px solid var(--border); background:var(--bg3); }
  .crm-chat-input input { flex:1; padding:7px 10px; font-size:12px; background:var(--bg1); border:1px solid var(--border); border-radius:6px; color:var(--text); font-family:inherit; outline:none; }
  .crm-chat-input input:focus { border-color:var(--accent); }
  .crm-chat-input button { padding:7px 14px; font-size:14px; background:var(--accent); color:#fff; border:none; border-radius:6px; cursor:pointer; transition:opacity .15s; }
  .crm-chat-input button:hover { opacity:.85; }
  .crm-chat-input button:disabled { opacity:.4; cursor:not-allowed; }
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; z-index:1000; }
  .modal { background:var(--bg2); border:1px solid var(--border); border-radius:10px; padding:20px; min-width:320px; max-width:440px; display:flex; flex-direction:column; gap:10px; }
  .modal h3 { margin:0 0 4px; font-size:14px; font-weight:600; color:var(--text); }
  .modal-actions { display:flex; gap:8px; margin-top:6px; }
</style>
