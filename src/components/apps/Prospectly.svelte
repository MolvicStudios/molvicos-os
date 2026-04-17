<script>
  import { streamAI } from '$lib/ai/stream.js';
  import { createAppHistory } from '$lib/stores/history.js';
  import { exportTXT, exportPDF, copyToClipboard } from '$lib/utils/export.js';
  import { t } from '$lib/i18n/index.js';
  import { onMount } from 'svelte';

  const history = createAppHistory('prospectly');

  let activeTab      = 'finder';
  let isGenerating   = false;
  let result         = '';
  let copySuccess    = false;

  // --- Finder ---
  let finderRole     = '';
  let finderIndustry = '';
  let finderCompSize = 'startup';
  let finderLocation = '';

  // --- Email Sequence ---
  let seqProspect    = '';
  let seqProduct     = '';
  let seqTone        = 'professional';

  // --- LinkedIn ---
  let liProfile      = '';
  let liContext      = '';

  // --- ICP ---
  let icpOffer       = '';
  let icpSector      = '';
  let icpChannel     = 'LinkedIn';

  // --- Call Script ---
  let scriptTarget   = '';
  let scriptOffer    = '';
  let scriptObjective = 'book a meeting';

  // --- Objections ---
  let objOffer       = '';
  let objTarget      = '';

  // --- Follow-up ---
  let fuProspect     = '';
  let fuProduct      = '';

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

  function generateICP() {
    if (!icpOffer.trim()) return;
    generate(
      `You are a B2B sales strategist. Generate a detailed Ideal Customer Profile (ICP).
Structure your response with these clear sections:

## ICP DESCRIPTION
A detailed paragraph describing the ideal customer.

## COMPANY SIZE
Revenue range and employee count.

## DECISION MAKER
Job titles and roles that make the purchase decision.

## TOP PAIN POINTS
- Pain point 1
- Pain point 2
- Pain point 3

## BUYING SIGNALS
Signs that indicate they are ready to buy:
- Signal 1
- Signal 2
- Signal 3

## WHERE TO FIND THEM
- LinkedIn: specific search query
- Google: specific query
- Communities/Events: specific places

## VALUE PROPOSITION
One compelling sentence summarizing the value you deliver.

Be specific, realistic, and actionable.`,
      `What I sell: ${icpOffer}\nMy sector: ${icpSector || 'B2B'}\nMain channel: ${icpChannel}`
    );
  }

  function generateCallScript() {
    if (!scriptTarget.trim() || !scriptOffer.trim()) return;
    generate(
      `You are an expert B2B sales trainer. Generate a complete, conversational cold call script.
Structure with these exact sections:

## OPENING (first 15 seconds)
The exact words to introduce yourself and state reason for calling. Grab attention immediately.

## HOOK
One sentence that sparks curiosity or references a pain point relevant to their role.

## DISCOVERY QUESTIONS
4 open-ended questions to uncover needs and qualify the prospect:
1. Question about current situation
2. Question about pain/challenge
3. Question about consequences
4. Question about desired outcome

## 30-SECOND PITCH
A concise value pitch tailored to the discovery answers. Focus on outcome, not features.

## CLOSE
How to ask for the next step (calendar booking / demo / follow-up call). Handle "send me more info" response.

Use {first_name} and {company} placeholders. Make it natural, not robotic.`,
      `Target prospect: ${scriptTarget}\nProduct/Service: ${scriptOffer}\nCall objective: ${scriptObjective}`
    );
  }

  function generateObjections() {
    if (!objOffer.trim()) return;
    generate(
      `You are a B2B sales expert. Generate a comprehensive objection handling guide.
For each of the 6 most common sales objections, provide:

## OBJECTION: "[exact words the prospect says]"
**Root cause:** Why they really say this
**Response:** Empathize → Reframe → Redirect (full script)
**Redirect question:** The question to move the conversation forward

Make responses conversational and non-pushy. Avoid hollow scripts like "I understand, but...".`,
      `What I sell: ${objOffer}\nTypical prospect: ${objTarget || 'B2B decision maker'}`
    );
  }

  function generateFollowup() {
    if (!fuProspect.trim() || !fuProduct.trim()) return;
    generate(
      `You are a B2B outreach expert. Generate a multi-channel follow-up sequence.
Create a 6-touch sequence across Email and LinkedIn. Each touch must lead with a different angle.

Format each touch as:

### TOUCH [N] — Day [X] — [Channel]
**Subject:** (if email)
**Message:** (max 80 words, use {first_name} and {company})
**CTA:** (one specific call to action)

Schedule: Day 1 (Email), Day 3 (LinkedIn), Day 5 (Email reply), Day 8 (LinkedIn), Day 12 (Email), Day 16 (Final email — breakup).
Each message must reference a different value angle or trigger. Never repeat the same hook.`,
      `Prospect info: ${fuProspect}\nProduct/Service: ${fuProduct}`
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

  function pdf() {
    exportPDF(result, `Prospectly — ${activeTab}`);
  }
</script>

<div class="prospectly">

  <div class="p-tabs">
    {#each [['finder','🔍','Finder'],['icp','🎯','ICP'],['sequence','✉','Emails'],['followup','📅','Follow-up'],['script','📞','Call Script'],['objections','🛡','Objections'],['linkedin','in','LinkedIn'],['saved','📋','Saved']] as [id, icon, label]}
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

      {:else if activeTab === 'icp'}
        <div class="form-field">
          <label for="p-icp-offer">What You Sell</label>
          <textarea id="p-icp-offer" bind:value={icpOffer} rows="3" placeholder="Describe your product or service..."></textarea>
        </div>
        <div class="form-field">
          <label for="p-icp-sector">Your Sector</label>
          <input id="p-icp-sector" bind:value={icpSector} placeholder="e.g. SaaS, Consulting, E-commerce" />
        </div>
        <div class="form-field">
          <label for="p-icp-channel">Main Channel</label>
          <select id="p-icp-channel" bind:value={icpChannel}>
            {#each ['LinkedIn','Cold Email','Cold Calling','Events','Referrals'] as ch}
              <option value={ch}>{ch}</option>
            {/each}
          </select>
        </div>
        <button class="gen-btn" on:click={generateICP} disabled={isGenerating || !icpOffer.trim()}>
          {isGenerating ? 'Generating...' : '🎯 Generate ICP — 2 cr'}
        </button>

      {:else if activeTab === 'script'}
        <div class="form-field">
          <label for="p-script-target">Target Prospect</label>
          <input id="p-script-target" bind:value={scriptTarget} placeholder="e.g. Head of Marketing at SaaS startup" />
        </div>
        <div class="form-field">
          <label for="p-script-offer">Your Product/Service</label>
          <textarea id="p-script-offer" bind:value={scriptOffer} rows="3" placeholder="What you sell and main value prop..."></textarea>
        </div>
        <div class="form-field">
          <label for="p-script-obj">Call Objective</label>
          <select id="p-script-obj" bind:value={scriptObjective}>
            {#each ['book a meeting','qualify the prospect','present a demo','close a deal'] as obj}
              <option value={obj}>{obj}</option>
            {/each}
          </select>
        </div>
        <button class="gen-btn" on:click={generateCallScript} disabled={isGenerating || !scriptTarget.trim() || !scriptOffer.trim()}>
          {isGenerating ? 'Generating...' : '📞 Generate Script — 2 cr'}
        </button>

      {:else if activeTab === 'objections'}
        <div class="form-field">
          <label for="p-obj-offer">What You Sell</label>
          <textarea id="p-obj-offer" bind:value={objOffer} rows="3" placeholder="Describe your product or service..."></textarea>
        </div>
        <div class="form-field">
          <label for="p-obj-target">Typical Prospect</label>
          <input id="p-obj-target" bind:value={objTarget} placeholder="e.g. CFO at mid-size company" />
        </div>
        <button class="gen-btn" on:click={generateObjections} disabled={isGenerating || !objOffer.trim()}>
          {isGenerating ? 'Generating...' : '🛡 Handle Objections — 2 cr'}
        </button>

      {:else if activeTab === 'followup'}
        <div class="form-field">
          <label for="p-fu-prospect">Prospect Info</label>
          <textarea id="p-fu-prospect" bind:value={fuProspect} rows="4" placeholder="Name, title, company, initial context..."></textarea>
        </div>
        <div class="form-field">
          <label for="p-fu-product">Your Product/Service</label>
          <textarea id="p-fu-product" bind:value={fuProduct} rows="3" placeholder="What you offer and main value prop..."></textarea>
        </div>
        <button class="gen-btn" on:click={generateFollowup} disabled={isGenerating || !fuProspect.trim() || !fuProduct.trim()}>
          {isGenerating ? 'Generating...' : '📅 Generate Follow-up — 2 cr'}
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
            <button on:click={pdf}>Export PDF</button>
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
  .p-tabs { display: flex; border-bottom: 1px solid var(--border); padding: 0 8px; flex-shrink: 0; overflow-x: auto; scrollbar-width: none; }
  .p-tabs::-webkit-scrollbar { display: none; }
  .p-tab {
    background: none; border: none; border-bottom: 2px solid transparent;
    padding: 10px 11px; font-size: 10px; color: var(--text-secondary);
    cursor: pointer; font-family: var(--font-mono); transition: all var(--transition);
    margin-bottom: -1px; white-space: nowrap; flex-shrink: 0;
  }
  .p-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
  .p-body { display: flex; flex: 1; overflow: hidden; }
  .p-form { width: 300px; flex-shrink: 0; padding: 14px; overflow-y: auto; border-right: 1px solid var(--border); display: flex; flex-direction: column; gap: 12px; }
  .form-field { display: flex; flex-direction: column; gap: 5px; }
  .form-field label { font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }
  .form-field select {
    background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm);
    color: var(--text-primary); font-size: 11px; padding: 6px 8px; font-family: var(--font-mono);
    outline: none; cursor: pointer;
  }
  .form-field select:focus { border-color: var(--accent-border); }
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
