<script>
  import { streamAI } from '$lib/ai/stream.js';
  import { createAppHistory } from '$lib/stores/history.js';
  import { exportTXT, copyToClipboard } from '$lib/utils/export.js';
  import { t } from '$lib/i18n/index.js';
  import { onMount } from 'svelte';

  const history = createAppHistory('prospectly');

  let activeTab      = 'finder';
  let isGenerating   = false;
  let result         = '';
  let copySuccess    = false;

  let finderRole     = '';
  let finderIndustry = '';
  let finderCompSize = 'startup';
  let finderLocation = '';

  let seqProspect    = '';
  let seqProduct     = '';
  let seqTone        = 'professional';

  let liProfile      = '';
  let liContext      = '';

  let savedProspects = JSON.parse(localStorage.getItem('ms_prospectly_leads') || '[]');

  onMount(() => {
    const handler = (e) => {
      if (e.detail?.appId === 'prospectly') {
        seqProspect = e.detail.prompt;
        activeTab = 'sequence';
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
      temperature: 0.8,
      action: 'prospectly',
      onChunk: (_, full) => { result = full; },
      onDone: (full) => {
        result = full;
        isGenerating = false;
        history.add({ tab: activeTab, snippet: full.slice(0, 80), ts: Date.now() });
      },
      onError: (err) => {
        result = `Error: ${err}`;
        isGenerating = false;
      },
    });
  }

  function findProspects() {
    if (!finderRole.trim()) return;
    generate(
      `You are a B2B sales research expert. Generate 10 detailed prospect profiles in JSON-like format.
Each profile: Name (realistic), Title, Company, Company Size, LinkedIn URL (realistic format),
Pain Points (2-3 bullet points), Best Contact Time, Personalization Hook.
Format cleanly, easy to scan. Be specific and realistic.`,
      `Find 10 ${finderRole} prospects at ${finderCompSize} companies in ${finderIndustry} industry${finderLocation ? `, based in ${finderLocation}` : ''}.`
    );
  }

  function generateSequence() {
    if (!seqProspect.trim() || !seqProduct.trim()) return;
    generate(
      `You are an expert cold email copywriter. Generate a 5-step cold email sequence.
Each email: Subject line, Body (max 120 words), CTA.
Tone: ${seqTone}. Use {first_name} and {company} placeholders.
Label each email: Email 1 (Day 1), Email 2 (Day 3), etc.`,
      `Product/Service: ${seqProduct}\nProspect profile: ${seqProspect}`
    );
  }

  function generateLinkedIn() {
    if (!liProfile.trim()) return;
    generate(
      `You are a LinkedIn outreach expert. Write a personalized LinkedIn connection request message.
Max 300 characters. Mention something specific from their profile.
No generic openers like "I'd like to add you to my network."
Context about why I'm reaching out: ${liContext || 'B2B outreach'}`,
      `Prospect profile: ${liProfile}`
    );
  }

  function saveProspect() {
    if (!result) return;
    const prospect = {
      id:      crypto.randomUUID(),
      content: result.slice(0, 500),
      tab:     activeTab,
      ts:      Date.now(),
    };
    savedProspects = [prospect, ...savedProspects].slice(0, 50);
    localStorage.setItem('ms_prospectly_leads', JSON.stringify(savedProspects));
  }

  async function copy() {
    await copyToClipboard(result);
    copySuccess = true;
    setTimeout(() => copySuccess = false, 2000);
  }
</script>

<div class="prospectly">

  <div class="p-tabs">
    {#each [['finder','🔍','Prospect Finder'],['sequence','✉','Email Sequence'],['linkedin','in','LinkedIn Message'],['saved','📋','Saved']] as [id, icon, label]}
      <button class="p-tab" class:active={activeTab === id} on:click={() => { activeTab = id; result = ''; }}>
        {icon} {label}
      </button>
    {/each}
  </div>

  <div class="p-body">

    <div class="p-form">

      {#if activeTab === 'finder'}
        <div class="form-field">
          <label for="p-finder-role">Target Role</label>
          <input id="p-finder-role" bind:value={finderRole} placeholder="e.g. Marketing Director" />
        </div>
        <div class="form-field">
          <label for="p-finder-industry">Industry</label>
          <input id="p-finder-industry" bind:value={finderIndustry} placeholder="e.g. SaaS, E-commerce" />
        </div>
        <div class="form-field">
          <span>Company Size</span>
          <div class="radio-group">
            {#each [['startup','Startup'],['smb','SMB'],['enterprise','Enterprise']] as [val, lab]}
              <label class="radio-label">
                <input type="radio" bind:group={finderCompSize} value={val} />
                {lab}
              </label>
            {/each}
          </div>
        </div>
        <div class="form-field">
          <label for="p-finder-location">Location (optional)</label>
          <input id="p-finder-location" bind:value={finderLocation} placeholder="e.g. United States" />
        </div>
        <button class="gen-btn" on:click={findProspects} disabled={isGenerating || !finderRole.trim()}>
          {isGenerating ? 'Searching...' : '🔍 Find Prospects — 2 cr'}
        </button>

      {:else if activeTab === 'sequence'}
        <div class="form-field">
          <label for="p-seq-prospect">Prospect Info</label>
          <textarea id="p-seq-prospect" bind:value={seqProspect} rows="4" placeholder="Name, title, company, pain points..."></textarea>
        </div>
        <div class="form-field">
          <label for="p-seq-product">Your Product/Service</label>
          <textarea id="p-seq-product" bind:value={seqProduct} rows="3" placeholder="What you offer and main value prop..."></textarea>
        </div>
        <div class="form-field">
          <span>Tone</span>
          <div class="radio-group">
            {#each [['professional','Professional'],['casual','Casual'],['direct','Direct']] as [val, lab]}
              <label class="radio-label">
                <input type="radio" bind:group={seqTone} value={val} />
                {lab}
              </label>
            {/each}
          </div>
        </div>
        <button class="gen-btn" on:click={generateSequence} disabled={isGenerating || !seqProspect.trim() || !seqProduct.trim()}>
          {isGenerating ? 'Writing...' : '✉ Generate Sequence — 2 cr'}
        </button>

      {:else if activeTab === 'linkedin'}
        <div class="form-field">
          <label for="p-li-profile">Prospect Profile</label>
          <textarea id="p-li-profile" bind:value={liProfile} rows="4" placeholder="Name, current role, recent activity, interests..."></textarea>
        </div>
        <div class="form-field">
          <label for="p-li-context">Your Context</label>
          <input id="p-li-context" bind:value={liContext} placeholder="Why are you reaching out?" />
        </div>
        <button class="gen-btn" on:click={generateLinkedIn} disabled={isGenerating || !liProfile.trim()}>
          {isGenerating ? 'Writing...' : 'in Write Message — 2 cr'}
        </button>

      {:else if activeTab === 'saved'}
        <div class="saved-list">
          {#if savedProspects.length === 0}
            <p class="empty-msg">No saved prospects yet. Generate and save from other tabs.</p>
          {:else}
            {#each savedProspects as p (p.id)}
              <div class="saved-item">
                <span class="saved-tab">{p.tab}</span>
                <p class="saved-snippet">{p.content.slice(0, 120)}...</p>
                <div class="saved-actions">
                  <button on:click={() => { result = p.content; activeTab = p.tab; }}>View</button>
                  <button on:click={() => { savedProspects = savedProspects.filter(x => x.id !== p.id); localStorage.setItem('ms_prospectly_leads', JSON.stringify(savedProspects)); }}>Delete</button>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      {/if}

    </div>

    {#if activeTab !== 'saved'}
      <div class="p-result">
        {#if result}
          <div class="result-actions">
            <button on:click={copy}>{copySuccess ? '✓ Copied!' : 'Copy'}</button>
            <button on:click={() => exportTXT(result, `prospectly-${activeTab}.txt`)}>Export TXT</button>
            <button on:click={saveProspect}>Save</button>
          </div>
          <pre class="result-text">{result}{isGenerating ? '▋' : ''}</pre>
        {:else if isGenerating}
          <div class="result-loading">
            <span class="loading-glyph">◈</span>
            <span>Generating...</span>
          </div>
        {:else}
          <div class="result-empty">
            Results will appear here.
          </div>
        {/if}
      </div>
    {/if}

  </div>
</div>

<style>
  .prospectly { display: flex; flex-direction: column; height: 100%; font-family: var(--font-mono); }
  .p-tabs { display: flex; border-bottom: 1px solid var(--border); padding: 0 12px; flex-shrink: 0; }
  .p-tab {
    background: none; border: none; border-bottom: 2px solid transparent;
    padding: 10px 14px; font-size: 11px; color: var(--text-secondary);
    cursor: pointer; font-family: var(--font-mono); transition: all var(--transition);
    margin-bottom: -1px;
  }
  .p-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
  .p-body { display: flex; flex: 1; overflow: hidden; }
  .p-form { width: 300px; flex-shrink: 0; padding: 14px; overflow-y: auto; border-right: 1px solid var(--border); display: flex; flex-direction: column; gap: 12px; }
  .form-field { display: flex; flex-direction: column; gap: 5px; }
  .form-field label { font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }
  .radio-group { display: flex; gap: 10px; flex-wrap: wrap; }
  .radio-label { font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; cursor: pointer; }
  .gen-btn {
    background: var(--accent); border: none; border-radius: var(--radius-sm);
    color: #000; font-size: 11px; padding: 9px 14px; cursor: pointer;
    font-family: var(--font-mono); font-weight: 500; margin-top: 4px;
    transition: opacity var(--transition);
  }
  .gen-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .p-result { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .result-actions { display: flex; gap: 6px; padding: 8px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .result-actions button {
    background: none; border: 1px solid var(--border); border-radius: var(--radius-sm);
    color: var(--text-secondary); font-size: 10px; padding: 4px 10px; cursor: pointer;
    font-family: var(--font-mono); transition: all var(--transition);
  }
  .result-actions button:hover { color: var(--accent); border-color: var(--accent-border); }
  .result-text { flex: 1; overflow-y: auto; padding: 14px; font-size: 11px; color: var(--text-primary); white-space: pre-wrap; word-break: break-word; line-height: 1.7; margin: 0; }
  .result-loading, .result-empty { flex: 1; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 10px; color: var(--text-secondary); font-size: 12px; }
  .loading-glyph { font-size: 24px; color: var(--accent); animation: pulse-accent 2s infinite; }
  .saved-list { display: flex; flex-direction: column; gap: 8px; overflow-y: auto; }
  .saved-item { background: var(--bg-input); border-radius: var(--radius-sm); padding: 10px; }
  .saved-tab   { font-size: 9px; color: var(--accent); text-transform: uppercase; letter-spacing: 1px; }
  .saved-snippet { font-size: 10px; color: var(--text-secondary); line-height: 1.5; margin: 4px 0; }
  .saved-actions { display: flex; gap: 6px; }
  .saved-actions button { background: none; border: 1px solid var(--border); border-radius: 4px; color: var(--text-secondary); font-size: 10px; padding: 2px 8px; cursor: pointer; font-family: var(--font-mono); }
  .empty-msg { font-size: 11px; color: var(--text-secondary); text-align: center; padding: 20px 0; }
</style>
