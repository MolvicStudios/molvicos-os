<script>
  import { streamAI } from '$lib/ai/stream.js';
  import { canAfford } from '$lib/plans/credits.js';
  import { createAppHistory } from '$lib/stores/history.js';
  import { exportTXT, exportPDF, copyToClipboard } from '$lib/utils/export.js';
  import { t } from '$lib/i18n/index.js';
  import { onMount } from 'svelte';

  const history = createAppHistory('aiworksuite');

  let activeModule  = 'teams';
  let isGenerating  = false;
  let result        = '';
  let copySuccess   = false;

  // --- Teams ---
  let teams = JSON.parse(localStorage.getItem('ms_aiws_teams') || '[]');
  let teamName      = '';
  let teamProject   = '';
  let teamSize      = '3';
  let teamRoles     = '';
  let editingTeam   = null;

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
    if (!canAfford('aiworksuite')) {
      result = 'Not enough credits.';
      return;
    }
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

  // --- Teams ---
  function saveTeam() {
    if (!teamName.trim()) return;
    const team = {
      id: editingTeam?.id || crypto.randomUUID(),
      name: teamName,
      project: teamProject,
      size: parseInt(teamSize) || 3,
      roles: teamRoles,
      createdAt: editingTeam?.createdAt || new Date().toISOString()
    };
    if (editingTeam) {
      teams = teams.map(t => t.id === team.id ? team : t);
    } else {
      teams = [team, ...teams].slice(0, 20);
    }
    localStorage.setItem('ms_aiws_teams', JSON.stringify(teams));
    editingTeam = null;
    teamName = ''; teamProject = ''; teamSize = '3'; teamRoles = '';
  }

  function editTeam(team) {
    editingTeam = team;
    teamName = team.name;
    teamProject = team.project;
    teamSize = String(team.size);
    teamRoles = team.roles || '';
  }

  function deleteTeam(id) {
    teams = teams.filter(t => t.id !== id);
    localStorage.setItem('ms_aiws_teams', JSON.stringify(teams));
  }

  function generateTeamPlan() {
    if (!teamName.trim()) return;
    generate(`You are an expert team management and organizational design consultant.
Generate a comprehensive team plan including:
- Team Structure: roles, responsibilities, and reporting lines
- Communication Plan: meetings, tools, async protocols
- Project Milestones: key phases and deliverables timeline
- Workflow: how work flows between team members
- KPIs: measurable success metrics for the team
Format in clear sections with actionable items.`,
      `Team: ${teamName}\nProject: ${teamProject || 'General team operations'}\nTeam size: ${teamSize}\nRoles: ${teamRoles || 'To be determined by AI'}`
    );
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
        on:click={() => { activeModule = id; result = ''; }}>
        {icon} {$t(`apps.aiworksuite.${id}`)}
      </button>
    {/each}
  </div>

  <div class="aiws-body">

    <div class="aiws-form">

      {#if activeModule === 'teams'}
        <div class="form-field"><label>{$t('apps.aiworksuite.teamName')}</label>
          <input bind:value={teamName} placeholder="Marketing Team" /></div>
        <div class="form-field"><label>{$t('apps.aiworksuite.teamProject')}</label>
          <textarea bind:value={teamProject} rows="3" placeholder={$t('apps.aiworksuite.teamProjectPh')}></textarea></div>
        <div class="form-field"><label>{$t('apps.aiworksuite.teamSize')}</label>
          <input bind:value={teamSize} type="number" min="2" max="20" /></div>
        <div class="form-field"><label>{$t('apps.aiworksuite.teamRoles')}</label>
          <input bind:value={teamRoles} placeholder="Designer, Developer, PM..." /></div>
        <div style="display:flex;gap:6px">
          <button class="gen-btn" style="flex:1" on:click={saveTeam} disabled={!teamName.trim()}>
            💾 {editingTeam ? $t('common.save') : $t('apps.aiworksuite.createTeam')}
          </button>
          <button class="gen-btn" style="flex:1" on:click={generateTeamPlan} disabled={isGenerating || !teamName.trim()}>
            {isGenerating ? $t('common.loading') : `🤖 ${$t('apps.aiworksuite.generatePlan')}`}
          </button>
        </div>

        {#if teams.length > 0}
          <div class="teams-label">{$t('apps.aiworksuite.savedTeams')}</div>
          <div class="teams-list">
            {#each teams as team (team.id)}
              <div class="team-card">
                <div class="tc-info">
                  <span class="tc-name">👥 {team.name}</span>
                  <span class="tc-meta">{team.size} members · {team.project?.slice(0,40) || '—'}</span>
                </div>
                <div class="tc-actions">
                  <button class="tc-btn" on:click={() => editTeam(team)}>✏️</button>
                  <button class="tc-btn" on:click={() => deleteTeam(team.id)}>×</button>
                </div>
              </div>
            {/each}
          </div>
        {/if}

      {:else if activeModule === 'invoice'}
        <div class="form-field"><label>{$t('apps.aiworksuite.clientName')}</label>
          <input bind:value={invClient} placeholder="Acme Corp" /></div>
        <div class="form-field"><label>{$t('apps.aiworksuite.services')}</label>
          <textarea bind:value={invServices} rows="4" placeholder="Web design - 20h @ $80/h&#10;Copywriting - 5h @ $60/h"></textarea></div>
        <div class="form-field"><label>{$t('apps.aiworksuite.totalAmount')}</label>
          <div style="display:flex;gap:6px">
            <input bind:value={invTotal} placeholder="2000" style="flex:1" />
            <select bind:value={invCurrency} style="width:70px">
              {#each ['USD','EUR','GBP','CAD','AUD'] as c}<option>{c}</option>{/each}
            </select>
          </div></div>
        <div class="form-field"><label>{$t('apps.aiworksuite.dueDate')}</label>
          <input bind:value={invDueDate} placeholder="30 days" /></div>
        <button class="gen-btn" on:click={generateInvoice} disabled={isGenerating || !invClient.trim()}>
          {isGenerating ? $t('common.loading') : `🧾 ${$t('apps.aiworksuite.generate')} — 1 cr`}</button>

      {:else if activeModule === 'proposal'}
        <div class="form-field"><label>{$t('apps.aiworksuite.projectDesc')}</label>
          <textarea bind:value={propProject} rows="4" placeholder="Build a landing page for a SaaS product..."></textarea></div>
        <div class="form-field"><label>{$t('apps.aiworksuite.clientName')}</label>
          <input bind:value={propClient} placeholder="Client" /></div>
        <div class="form-field"><label>{$t('apps.aiworksuite.budget')}</label>
          <input bind:value={propBudget} placeholder="$2,000 - $4,000" /></div>
        <div class="form-field"><label>{$t('apps.aiworksuite.timeline')}</label>
          <input bind:value={propTimeline} placeholder="2-3 weeks" /></div>
        <button class="gen-btn" on:click={generateProposal} disabled={isGenerating || !propProject.trim()}>
          {isGenerating ? $t('common.loading') : `📄 ${$t('apps.aiworksuite.generate')} — 1 cr`}</button>

      {:else if activeModule === 'contract'}
        <div class="form-field"><label>{$t('apps.aiworksuite.projectScope')}</label>
          <textarea bind:value={ctxProject} rows="3" placeholder="Website redesign including 5 pages..."></textarea></div>
        <div class="form-field"><label>{$t('apps.aiworksuite.clientName')}</label>
          <input bind:value={ctxClient} placeholder="Client" /></div>
        <div class="form-field"><label>{$t('apps.aiworksuite.ratePayment')}</label>
          <input bind:value={ctxRate} placeholder="$3,500 flat / $80/hour" /></div>
        <div class="form-field"><label>{$t('apps.aiworksuite.scopeNotes')}</label>
          <textarea bind:value={ctxScope} rows="2" placeholder="3 revision rounds included..."></textarea></div>
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
        <div class="form-field"><label>{$t('apps.aiworksuite.annualIncome')}</label>
          <input bind:value={rateDesiredSalary} placeholder="60000" type="number" /></div>
        <div class="form-field"><label>{$t('apps.aiworksuite.billableWeeks')}</label>
          <input bind:value={rateWorkWeeks} type="number" min="1" max="52" /></div>
        <div class="form-field"><label>{$t('apps.aiworksuite.billableHours')}</label>
          <input bind:value={rateHoursPerWeek} type="number" min="1" max="60" /></div>
        <div class="form-field"><label>{$t('apps.aiworksuite.overheadPct')}</label>
          <input bind:value={rateOverhead} type="number" min="0" max="100" /></div>
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
    color: #000; font-size: 11px; padding: 9px 14px; cursor: pointer;
    font-family: var(--font-mono); font-weight: 500; margin-top: 4px;
  }
  .gen-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .time-entry-form { display: flex; gap: 5px; align-items: center; }
  .add-btn { background: var(--accent); border: none; border-radius: 4px; color: #000; font-size: 14px; width: 28px; height: 28px; cursor: pointer; flex-shrink: 0; }
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

  .teams-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); margin-top: 6px; }
  .teams-list { display: flex; flex-direction: column; gap: 6px; }
  .team-card { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: var(--radius-sm); background: var(--bg-input); }
  .tc-info { flex: 1; display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
  .tc-name { font-size: 11px; color: var(--text-primary); font-weight: 500; }
  .tc-meta { font-size: 9px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tc-actions { display: flex; gap: 4px; flex-shrink: 0; }
  .tc-btn { background: none; border: none; color: var(--text-muted); font-size: 13px; cursor: pointer; padding: 2px 4px; }
  .tc-btn:hover { color: var(--accent); }
</style>
