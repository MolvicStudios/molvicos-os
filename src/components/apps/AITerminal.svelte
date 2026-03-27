<script>
  import { onMount, tick } from 'svelte';
  import { streamAI } from '$lib/ai/stream.js';
  import { getActiveProvider } from '$lib/providers/active.js';
  import { detectOllama } from '$lib/ollama/client.js';
  import { t } from '$lib/i18n/index.js';

  let lines       = [];
  let inputValue  = '';
  let inputEl;
  let outputEl;
  let isStreaming = false;
  let streamingId = null;

  let history     = JSON.parse(localStorage.getItem('ms_terminal_history') || '[]');
  let historyIdx  = -1;

  let aliases     = JSON.parse(localStorage.getItem('ms_terminal_aliases') || '{}');

  let conversation = [];

  const BUILTINS = {
    help:    () => showHelp(),
    clear:   () => { lines = []; addLine('system', 'Terminal cleared.'); },
    history: () => history.slice(-20).forEach((h, i) => addLine('output', `${history.length - 20 + i + 1}  ${h}`)),
    reset:   () => { conversation = []; addLine('system', 'Conversation context reset.'); },
    model:   () => {
      const p = getActiveProvider();
      addLine('output', p ? `Active: ${p.provider} · ${p.model}` : 'No provider configured. Add an API key in Settings.');
    },
    aliases: () => {
      const list = Object.entries(aliases);
      if (list.length === 0) { addLine('output', 'No aliases defined.'); return; }
      list.forEach(([k, v]) => addLine('output', `${k.padEnd(12)} → ${v}`));
    },
    exit:    () => addLine('system', 'Use the window close button to exit.'),
  };

  onMount(async () => {
    addLine('system', '◈ MOLVICOS AI TERMINAL v1.0');
    addLine('system', '─────────────────────────────');
    const p = getActiveProvider();
    if (p) {
      addLine('system', `Provider: ${p.provider} · Model: ${p.model}`);
    } else {
      addLine('error', 'No AI provider configured. Run: settings');
    }
    const ollama = await detectOllama();
    if (ollama.online) {
      addLine('system', `Ollama: online · ${ollama.models.length} model(s) available`);
    }
    addLine('system', 'Type "help" for commands, or just ask anything.');
    addLine('system', '');
    focusInput();
  });

  function addLine(type, text, id = null) {
    const entry = { id: id || crypto.randomUUID(), type, text, streaming: false };
    lines = [...lines, entry];
    scrollToBottom();
    return entry.id;
  }

  function updateLine(id, text, streaming = false) {
    lines = lines.map(l => l.id === id ? { ...l, text, streaming } : l);
    scrollToBottom();
  }

  async function scrollToBottom() {
    await tick();
    if (outputEl) outputEl.scrollTop = outputEl.scrollHeight;
  }

  function onKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateHistory(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateHistory(1);
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      if (isStreaming) {
        isStreaming = false;
        addLine('system', '^C');
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      BUILTINS.clear();
    }
  }

  function navigateHistory(dir) {
    if (history.length === 0) return;
    historyIdx = Math.max(-1, Math.min(history.length - 1, historyIdx + dir));
    inputValue = historyIdx === -1 ? '' : history[history.length - 1 - historyIdx];
  }

  async function submit() {
    const raw = inputValue.trim();
    if (!raw || isStreaming) return;

    inputValue = '';
    historyIdx = -1;

    if (raw && (history.length === 0 || history[history.length - 1] !== raw)) {
      history = [...history, raw].slice(-100);
      localStorage.setItem('ms_terminal_history', JSON.stringify(history));
    }

    addLine('input', `$ ${raw}`);

    const resolved = resolveAlias(raw);
    const cmd = resolved.split(/\s+/)[0].toLowerCase();

    if (cmd in BUILTINS) {
      BUILTINS[cmd](resolved.slice(cmd.length).trim());
      return;
    }

    if (cmd === 'alias') {
      handleAliasCmd(resolved);
      return;
    }

    if (cmd === 'unalias') {
      const name = resolved.split(/\s+/)[1];
      if (name && aliases[name]) {
        delete aliases[name];
        aliases = { ...aliases };
        localStorage.setItem('ms_terminal_aliases', JSON.stringify(aliases));
        addLine('system', `Alias '${name}' removed.`);
      } else {
        addLine('error', `No alias '${name}' found.`);
      }
      return;
    }

    await runAIQuery(resolved);
  }

  function resolveAlias(input) {
    const parts = input.split(/\s+/);
    if (aliases[parts[0]]) {
      return aliases[parts[0]] + (parts.length > 1 ? ' ' + parts.slice(1).join(' ') : '');
    }
    return input;
  }

  function handleAliasCmd(raw) {
    const parts = raw.split(/\s+/);
    if (parts[1] === 'set' && parts[2] && parts.length > 3) {
      const name  = parts[2];
      const value = parts.slice(3).join(' ');
      aliases = { ...aliases, [name]: value };
      localStorage.setItem('ms_terminal_aliases', JSON.stringify(aliases));
      addLine('system', `Alias set: ${name} → ${value}`);
    } else {
      addLine('error', 'Usage: alias set <name> <value>');
    }
  }

  async function runAIQuery(input) {
    const provider = getActiveProvider();
    if (!provider) {
      addLine('error', 'No AI provider. Configure API keys in Settings → AI & Models.');
      return;
    }

    isStreaming = true;
    const outputId = addLine('output', '▋');
    updateLine(outputId, '▋', true);
    streamingId = outputId;

    conversation = [...conversation, { role: 'user', content: input }].slice(-20);

    let fullText = '';

    await streamAI({
      system: `You are an AI assistant integrated into Molvicos OS terminal.
You are running in a CLI environment. Format responses for terminal output:
- Use plain text, no markdown headers
- Use simple ASCII for structure when needed
- Be concise — terminal users prefer short, precise answers
- For code: use plain code blocks without markdown fences
- For lists: use simple dashes or numbers
- Max response length: ~300 words unless explicitly asked for more
Current provider: ${provider.provider} · Model: ${provider.model}`,
      messages: conversation,
      temperature: 0.5,
      action: 'mira_message',
      onChunk: (delta, full) => {
        if (!isStreaming) return;
        fullText = full;
        updateLine(outputId, full + '▋', true);
      },
      onDone: (full) => {
        fullText = full;
        updateLine(outputId, full, false);
        conversation = [...conversation, { role: 'assistant', content: full }].slice(-20);
        isStreaming = false;
        streamingId = null;
        addLine('output', '');
        focusInput();
      },
      onError: (err) => {
        updateLine(outputId, `Error: ${err}`, false);
        isStreaming = false;
        streamingId = null;
        focusInput();
      },
    });
  }

  function showHelp() {
    const helpLines = [
      'Built-in commands:',
      '  help          Show this help',
      '  clear         Clear terminal (Ctrl+L)',
      '  reset         Reset conversation context',
      '  history       Show command history',
      '  model         Show active AI provider',
      '  aliases       List all aliases',
      '  alias set <name> <value>',
      '  unalias <name>',
      '  exit          Close info',
      '',
      'Shortcuts:',
      '  ↑ / ↓        Navigate history',
      '  Ctrl+C       Abort streaming',
      '  Ctrl+L       Clear terminal',
      '',
      'Just type anything to ask the AI.',
    ];
    helpLines.forEach(l => addLine('output', l));
  }

  function focusInput() {
    tick().then(() => inputEl?.focus());
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="terminal" on:click={focusInput}>

  <div class="terminal-output" bind:this={outputEl}>
    {#each lines as line (line.id)}
      <div class="terminal-line line-{line.type}" class:streaming={line.streaming}>
        <span class="line-text">{line.text}</span>
      </div>
    {/each}
  </div>

  <div class="terminal-input-row" class:disabled={isStreaming}>
    <span class="terminal-prompt">
      {isStreaming ? '···' : '$'}
    </span>
    <textarea
      bind:this={inputEl}
      bind:value={inputValue}
      on:keydown={onKeydown}
      disabled={isStreaming}
      rows="1"
      class="terminal-input"
      placeholder={isStreaming ? 'Streaming... (Ctrl+C to abort)' : 'Ask anything or type a command...'}
      spellcheck="false"
      autocomplete="off"
    ></textarea>
  </div>

</div>

<style>
  .terminal {
    display: flex; flex-direction: column; height: 100%;
    background: #02040a; cursor: text;
    font-family: 'Space Mono', 'Courier New', monospace;
  }
  .terminal-output {
    flex: 1; overflow-y: auto; padding: 12px 14px;
    display: flex; flex-direction: column; gap: 1px;
  }
  .terminal-line { font-size: 12px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; }
  .line-input  .line-text { color: #c8dfd4; }
  .line-output .line-text { color: #7aad8a; }
  .line-error  .line-text { color: #ff6677; }
  .line-system .line-text { color: #3a5a4a; }
  .streaming .line-text   { color: #7aad8a; opacity: 0.9; }

  .terminal-input-row {
    display: flex; align-items: flex-end; gap: 8px;
    padding: 8px 14px 10px;
    border-top: 1px solid #00ff8815;
    background: #030608;
  }
  .terminal-input-row.disabled { opacity: 0.6; }
  .terminal-prompt {
    color: #00ff88; font-size: 13px; font-family: 'Space Mono', monospace;
    padding-bottom: 6px; flex-shrink: 0; width: 16px; text-align: center;
  }
  .terminal-input {
    flex: 1; background: transparent; border: none;
    color: #c8dfd4; font-family: 'Space Mono', monospace;
    font-size: 12px; line-height: 1.6; resize: none;
    outline: none; padding: 4px 0;
    min-height: 24px; max-height: 120px; overflow-y: auto;
  }
  .terminal-input::placeholder { color: #2a3a30; }
  .terminal-input:disabled { cursor: not-allowed; }

  .terminal-output::-webkit-scrollbar { width: 4px; }
  .terminal-output::-webkit-scrollbar-track { background: transparent; }
  .terminal-output::-webkit-scrollbar-thumb { background: #00ff8820; border-radius: 2px; }
</style>
