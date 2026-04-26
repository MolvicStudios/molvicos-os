/* ════════════════════════════════════════════════════════════════
   PROSPECTLY — Dos herramientas integradas en AIWorkSuite
   · ProspectlyB2B        — Kit completo de prospección B2B
   · AutomatizacionesTool — Generador de recursos de automatización
   Replica las funciones exactas de prospectly.shop
   js/tools/prospectly.js — AIWorkSuite by MolvicStudios
   ════════════════════════════════════════════════════════════════
   NOTA: Los archivos prospectly-b2b.js y prospectly-auto.js
   fueron eliminados durante CR-02. Sus features de límites de
   uso (localStorage) están integradas aquí.
════════════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────────────────────
   TOOL 1 — KIT DE PROSPECCIÓN B2B
────────────────────────────────────────────────────────────── */
const ProspectlyB2B = (() => {
  let lastData = null;

  const SYSTEM_PROSPECTING = `Eres un experto en ventas B2B y prospección comercial con más de 10 años de experiencia.
Tu tarea es generar un kit completo de prospección personalizado basado en el cliente objetivo y la oferta del usuario.
Responde ÚNICAMENTE en formato JSON válido con esta estructura exacta:

{
  "icp": {
    "descripcion": "Descripción detallada del cliente ideal",
    "tamano_empresa": "Rango de empleados o facturación",
    "cargo_decision": "Cargo/s de la persona que toma la decisión de compra",
    "dolores_principales": ["dolor 1", "dolor 2", "dolor 3"],
    "senales_compra": ["señal 1", "señal 2", "señal 3"],
    "donde_encontrarlos": ["LinkedIn: búsqueda X", "Google: query Y", "Grupos: Z"],
    "mensaje_valor": "Propuesta de valor en una frase"
  },
  "email_frio": {
    "asunto_1": "Asunto opción 1",
    "cuerpo_1": "Email completo opción 1 (directo, basado en dolor)",
    "asunto_2": "Asunto opción 2",
    "cuerpo_2": "Email completo opción 2 (basado en curiosidad)",
    "asunto_3": "Asunto opción 3",
    "cuerpo_3": "Email completo opción 3 (basado en resultado/caso de uso)"
  },
  "linkedin": {
    "connection_request": "Mensaje de conexión (máx 300 chars)",
    "primer_mensaje": "Primer mensaje tras conectar",
    "followup_mensaje": "Mensaje de seguimiento si no responde"
  },
  "script_llamada": {
    "apertura": "Primeros 15 segundos de la llamada",
    "gancho": "Frase para captar interés",
    "descubrimiento": ["Pregunta 1", "Pregunta 2", "Pregunta 3"],
    "pitch": "Pitch de 30 segundos",
    "cierre": "Cómo pedir la siguiente reunión"
  },
  "objeciones": [
    {
      "objecion": "No tengo tiempo ahora",
      "respuesta": "Respuesta específica a esta objeción",
      "redireccion": "Cómo redirigir la conversación"
    }
  ],
  "followup_secuencia": [
    { "dia": 3,  "canal": "email",    "mensaje": "Mensaje de seguimiento día 3" },
    { "dia": 7,  "canal": "linkedin", "mensaje": "Mensaje LinkedIn día 7" },
    { "dia": 14, "canal": "email",    "mensaje": "Último intento día 14" }
  ]
}

No escribas nada fuera del JSON. Sin markdown, sin backticks. Sin comentarios.`;

  // ─── LÍMITES DE USO ────────────────────────────────────────────
  function b2bUsageKey() {
    const d = new Date();
    return `prospb2b_usage_${d.getFullYear()}_${d.getMonth()}`;
  }
  function b2bGetUsage()        { return parseInt(localStorage.getItem(b2bUsageKey()) || '0'); }
  function b2bIncrementUsage()  { localStorage.setItem(b2bUsageKey(), String(b2bGetUsage() + 1)); }
  function b2bCanGenerate()     {
    if (typeof USER_PLAN !== 'undefined' && USER_PLAN !== 'free') return true;
    return b2bGetUsage() < 3;
  }
  function b2bShowUpgrade()     {
    if (typeof showToast === 'function')
      showToast('Has alcanzado el límite de 3 kits/mes. Actualiza tu plan para generar más.', 'warn', 5000);
  }

  // ─── INIT / SHOW ────────────────────────────────────────────────
  function init() {}

  function onShow() {
    const panel = document.getElementById('prospectly-b2b-panel');
    if (!panel) return;
    if (!panel.innerHTML.trim()) renderForm(panel);
    updateBadge();
  }

  function updateBadge() {
    const b = document.getElementById('prospectly-b2b-badge');
    if (b) b.textContent = `${b2bGetUsage()}/3 kits este mes`;
  }

  // ─── FORM ───────────────────────────────────────────────────────
  function renderForm(panel) {
    panel.innerHTML = `
      <div class="p-tool-wrap">
        <div class="p-tool-header">
          <h2>Kit de Prospección B2B</h2>
          <p>Genera ICP, emails en frío, mensajes LinkedIn, script de llamada, manejo de objeciones y secuencia de follow-up.</p>
        </div>

        <div class="p-form">
          <div class="p-form-row">
            <div class="p-form-group">
              <label class="lbl" for="b2b-target">¿A quién le vendes?</label>
              <textarea id="b2b-target" class="inp" rows="3" placeholder="Ej: Directores de marketing de empresas SaaS B2B de 20-200 empleados en España"></textarea>
            </div>
            <div class="p-form-group">
              <label class="lbl" for="b2b-offer">¿Qué les vas a vender?</label>
              <textarea id="b2b-offer" class="inp" rows="3" placeholder="Ej: Servicio de automatización de prospección con IA que genera leads cualificados"></textarea>
            </div>
          </div>

          <div class="p-form-row">
            <div class="p-form-group">
              <label class="lbl" for="b2b-sector">Tu sector</label>
              <select id="b2b-sector" class="inp">
                <option value="SaaS">SaaS / Software</option>
                <option value="Servicios B2B">Servicios B2B</option>
                <option value="Consultoría">Consultoría</option>
                <option value="Agencia">Agencia de marketing</option>
                <option value="Ecommerce">Ecommerce</option>
                <option value="Tecnología">Tecnología / TI</option>
                <option value="Formación">Formación / Cursos</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div class="p-form-group">
              <label class="lbl" for="b2b-channel">Canal principal</label>
              <select id="b2b-channel" class="inp">
                <option value="Email frío">Email frío</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Llamada en frío">Llamada en frío</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Multicanal">Multicanal</option>
              </select>
            </div>
          </div>

          <div class="p-form-group">
            <label class="lbl">¿Qué quieres generar?</label>
            <div class="p-checkboxes">
              <label class="p-check-label"><input type="checkbox" id="b2b-icp"        checked> 🎯 Perfil de cliente ideal (ICP)</label>
              <label class="p-check-label"><input type="checkbox" id="b2b-email"      checked> 📧 3 Emails en frío</label>
              <label class="p-check-label"><input type="checkbox" id="b2b-linkedin"   checked> 💼 Mensajes LinkedIn</label>
              <label class="p-check-label"><input type="checkbox" id="b2b-script"     checked> 📞 Script de llamada</label>
              <label class="p-check-label"><input type="checkbox" id="b2b-objections" checked> 🛡️ Manejo de objeciones</label>
              <label class="p-check-label"><input type="checkbox" id="b2b-followup"   checked> 📅 Secuencia follow-up</label>
            </div>
          </div>

          <button id="b2b-generate-btn" class="btn btn-accent btn-full" style="font-size:15px;padding:12px">
            Generar kit de prospección →
          </button>
          <div style="margin-top:10px;text-align:center;font-size:12px;color:var(--text3)" id="b2b-usage-label">
            ${b2bGetUsage()}/3 kits usados este mes
          </div>
        </div>

        <div id="b2b-result" style="display:none;margin-top:24px">
          <div class="p-result-topbar">
            <span class="tag tag-accent">Kit generado</span>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-ghost btn-sm" id="b2b-copy-all-btn">Copiar todo</button>
              <button class="btn btn-ghost btn-sm" id="b2b-export-btn">↓ Exportar JSON</button>
              <button class="btn btn-ghost btn-sm" id="b2b-save-lib-btn">📚 Guardar en Biblioteca</button>
            </div>
          </div>
          <div id="b2b-result-content"></div>
        </div>
      </div>`;

    document.getElementById('b2b-generate-btn')?.addEventListener('click', handleGenerate);
    document.getElementById('b2b-export-btn')?.addEventListener('click', handleExport);
    document.getElementById('b2b-save-lib-btn')?.addEventListener('click', handleSaveToLib);
    document.getElementById('b2b-copy-all-btn')?.addEventListener('click', () => {
      if (!lastData) return;
      const text = buildPlainText(lastData);
      copyToClipboard(text, document.getElementById('b2b-copy-all-btn'), 'Copiar todo');
    });
  }

  // ─── GENERA ─────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!b2bCanGenerate()) { b2bShowUpgrade(); return; }

    const target  = document.getElementById('b2b-target')?.value?.trim();
    const offer   = document.getElementById('b2b-offer')?.value?.trim();
    if (!target || !offer) {
      typeof showToast === 'function' && showToast('Rellena el cliente objetivo y lo que vendes', 'warn');
      return;
    }

    const sector  = document.getElementById('b2b-sector')?.value;
    const channel = document.getElementById('b2b-channel')?.value;
    const options = {
      icp:        document.getElementById('b2b-icp')?.checked,
      email:      document.getElementById('b2b-email')?.checked,
      linkedin:   document.getElementById('b2b-linkedin')?.checked,
      script:     document.getElementById('b2b-script')?.checked,
      objections: document.getElementById('b2b-objections')?.checked,
      followup:   document.getElementById('b2b-followup')?.checked,
    };

    if (!Object.values(options).some(Boolean)) {
      typeof showToast === 'function' && showToast('Selecciona al menos un elemento a generar', 'warn');
      return;
    }

    const btn = document.getElementById('b2b-generate-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Generando kit...'; }

    const resultEl  = document.getElementById('b2b-result');
    const contentEl = document.getElementById('b2b-result-content');
    if (resultEl)  resultEl.style.display = 'block';
    if (contentEl) contentEl.innerHTML = '<div class="p-loading">Generando tu kit de prospección personalizado...</div>';

    const userMsg = `Genera el kit completo de prospección para:

CLIENTE OBJETIVO: ${target}
LO QUE VENDO: ${offer}
MI SECTOR: ${sector}
CANAL PRINCIPAL: ${channel}

Genera solo los elementos marcados como true:
ICP: ${options.icp}
Email en frío: ${options.email}
LinkedIn: ${options.linkedin}
Script llamada: ${options.script}
Objeciones: ${options.objections}
Secuencia follow-up: ${options.followup}

Personaliza todo al máximo según el cliente objetivo y la oferta. Que sea directo, sin clichés y listo para usar hoy.`;

    try {
      const raw   = await callAI(SYSTEM_PROSPECTING, [{ role: 'user', content: userMsg }], 3000);
      const clean = raw.replace(/```json|```/g, '').trim();
      lastData    = JSON.parse(clean);
      b2bIncrementUsage();
      updateBadge();
      renderKit(lastData, options, contentEl);
      resultEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      if (contentEl) contentEl.innerHTML = `<div class="p-error">Error: ${esc(err.message)}</div>`;
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Generar kit de prospección →'; }
    }
  }

  // ─── RENDER KIT ─────────────────────────────────────────────────
  function renderKit(data, options, container) {
    let html = '';

    if (options.icp && data.icp) {
      const icp = data.icp;
      html += `<div class="prosp-section">
        <h3>🎯 Perfil de cliente ideal (ICP)</h3>
        <div class="prosp-card">
          <p><strong>Descripción:</strong> ${esc(icp.descripcion)}</p>
          <p><strong>Tamaño empresa:</strong> ${esc(icp.tamano_empresa)}</p>
          <p><strong>Decisor:</strong> ${esc(icp.cargo_decision)}</p>
          <p><strong>Propuesta de valor:</strong> <em>${esc(icp.mensaje_valor)}</em></p>
          <div class="prosp-lists">
            <div><strong>Dolores principales:</strong><ul>${(icp.dolores_principales||[]).map(d=>`<li>${esc(d)}</li>`).join('')}</ul></div>
            <div><strong>Señales de compra:</strong><ul>${(icp.senales_compra||[]).map(s=>`<li>${esc(s)}</li>`).join('')}</ul></div>
            <div><strong>Dónde encontrarlos:</strong><ul>${(icp.donde_encontrarlos||[]).map(l=>`<li>${esc(l)}</li>`).join('')}</ul></div>
          </div>
        </div>
      </div>`;
    }

    if (options.email && data.email_frio) {
      const ef = data.email_frio;
      const emails = [
        { asunto: ef.asunto_1, cuerpo: ef.cuerpo_1, label: 'Directo (basado en dolor)' },
        { asunto: ef.asunto_2, cuerpo: ef.cuerpo_2, label: 'Curiosidad' },
        { asunto: ef.asunto_3, cuerpo: ef.cuerpo_3, label: 'Basado en resultado' },
      ];
      html += `<div class="prosp-section"><h3>📧 Emails en frío</h3>
        ${emails.map((e, i) => `
          <div class="prosp-card email-card">
            <div class="email-header">
              <span class="email-label">Opción ${i+1}: ${esc(e.label)}</span>
              <button class="btn btn-ghost btn-xs copy-email-btn" data-asunto="${esc(e.asunto)}" data-cuerpo="${esc(e.cuerpo).replace(/"/g,'"')}">Copiar</button>
            </div>
            <p class="email-subject"><strong>Asunto:</strong> ${esc(e.asunto)}</p>
            <pre class="email-body">${esc(e.cuerpo)}</pre>
          </div>`).join('')}
      </div>`;
    }

    if (options.linkedin && data.linkedin) {
      const li = data.linkedin;
      html += `<div class="prosp-section"><h3>💼 Mensajes LinkedIn</h3>
        <div class="prosp-card">
          <div class="linkedin-msg"><strong>Solicitud de conexión:</strong><div class="msg-box">${esc(li.connection_request)}</div></div>
          <div class="linkedin-msg"><strong>Primer mensaje:</strong><div class="msg-box">${esc(li.primer_mensaje)}</div></div>
          <div class="linkedin-msg"><strong>Follow-up:</strong><div class="msg-box">${esc(li.followup_mensaje)}</div></div>
        </div>
      </div>`;
    }

    if (options.script && data.script_llamada) {
      const s = data.script_llamada;
      html += `<div class="prosp-section"><h3>📞 Script de llamada</h3>
        <div class="prosp-card">
          <div class="script-block"><strong>Apertura (15s):</strong><p>${esc(s.apertura)}</p></div>
          <div class="script-block"><strong>Gancho:</strong><p>${esc(s.gancho)}</p></div>
          <div class="script-block"><strong>Preguntas de descubrimiento:</strong><ol>${(s.descubrimiento||[]).map(q=>`<li>${esc(q)}</li>`).join('')}</ol></div>
          <div class="script-block"><strong>Pitch 30s:</strong><p>${esc(s.pitch)}</p></div>
          <div class="script-block"><strong>Cierre:</strong><p>${esc(s.cierre)}</p></div>
        </div>
      </div>`;
    }

    if (options.objections && data.objeciones) {
      html += `<div class="prosp-section"><h3>🛡️ Manejo de objeciones</h3>
        ${data.objeciones.map(o => `
          <div class="prosp-card objection-card">
            <p class="objection-text">❝ ${esc(o.objecion)} ❞</p>
            <p><strong>Respuesta:</strong> ${esc(o.respuesta)}</p>
            <p class="objection-redirect"><strong>Redirección:</strong> ${esc(o.redireccion)}</p>
          </div>`).join('')}
      </div>`;
    }

    if (options.followup && data.followup_secuencia) {
      html += `<div class="prosp-section"><h3>📅 Secuencia de follow-up</h3>
        <div class="followup-timeline">
          ${data.followup_secuencia.map(f => `
            <div class="followup-item">
              <div class="followup-day">Día ${esc(String(f.dia))}</div>
              <div class="followup-channel tag tag-gray">${esc(f.canal)}</div>
              <div class="followup-msg">${esc(f.mensaje)}</div>
            </div>`).join('')}
        </div>
      </div>`;
    }

    container.innerHTML = html;

    // Copy email buttons — event delegation
    container.querySelectorAll('.copy-email-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = `Asunto: ${btn.dataset.asunto}\n\n${btn.dataset.cuerpo}`;
        copyToClipboard(text, btn, 'Copiar');
      });
    });
  }

  // ─── BUILD PLAIN TEXT ──────────────────────────────────────────
  function buildPlainText(data) {
    let txt = '';
    if (data.icp) {
      txt += `=== ICP ===\n${data.icp.descripcion}\nDecisor: ${data.icp.cargo_decision}\nValor: ${data.icp.mensaje_valor}\n\n`;
    }
    if (data.email_frio) {
      txt += `=== EMAIL 1 ===\nAsunto: ${data.email_frio.asunto_1}\n${data.email_frio.cuerpo_1}\n\n`;
      txt += `=== EMAIL 2 ===\nAsunto: ${data.email_frio.asunto_2}\n${data.email_frio.cuerpo_2}\n\n`;
      txt += `=== EMAIL 3 ===\nAsunto: ${data.email_frio.asunto_3}\n${data.email_frio.cuerpo_3}\n\n`;
    }
    if (data.linkedin) {
      txt += `=== LINKEDIN ===\nConexión: ${data.linkedin.connection_request}\nPrimer mensaje: ${data.linkedin.primer_mensaje}\nFollow-up: ${data.linkedin.followup_mensaje}\n\n`;
    }
    if (data.script_llamada) {
      const s = data.script_llamada;
      txt += `=== SCRIPT LLAMADA ===\nApertura: ${s.apertura}\nGancho: ${s.gancho}\nPitch: ${s.pitch}\nCierre: ${s.cierre}\n\n`;
    }
    return txt.trim();
  }

  // ─── EXPORT ─────────────────────────────────────────────────────
  function handleExport() {
    if (!lastData) return;
    downloadBlob(JSON.stringify(lastData, null, 2), `prospectly-b2b-${Date.now()}.json`, 'application/json');
    typeof showToast === 'function' && showToast('Kit exportado como JSON', 'success');
  }

  // ─── GUARDAR EN BIBLIOTECA ─────────────────────────────────────
  function handleSaveToLib() {
    if (!lastData) return;
    const target = document.getElementById('b2b-target')?.value?.trim() || 'Kit B2B';
    const industry = document.getElementById('b2b-industry')?.value?.trim() || '';
    const tone = document.getElementById('b2b-tone')?.value?.trim() || '';
    const title = 'Kit B2B: ' + target;
    const content = buildPlainText(lastData);
    const items = typeof getLib === 'function' ? getLib() : [];
    items.unshift({
      id: typeof genId === 'function' ? genId() : Date.now().toString(36),
      type: 'b2b',
      title,
      content,
      category: 'estrategia',
      tags: ['b2b', 'prospeccion', target.toLowerCase().slice(0, 20)],
      createdAt: typeof fmtDate === 'function' ? fmtDate() : new Date().toISOString().slice(0, 10),
      source: 'prospectly-b2b',
      sourceId: null,
      metadata: { target, industry, tone }
    });
    if (typeof saveLib === 'function') saveLib(items);
    if (typeof renderLib === 'function') renderLib();
    typeof showToast === 'function' && showToast('Kit B2B guardado en Biblioteca', 'success');
  }

  return { init, onShow };
})();


/* ──────────────────────────────────────────────────────────────
   TOOL 2 — GENERADOR DE RECURSOS DE AUTOMATIZACIÓN
────────────────────────────────────────────────────────────── */
const AutomatizacionesTool = (() => {
  let currentType  = 'prompt';
  let currentLevel = 'basic';
  let lastResult   = '';

  const TEMPLATES = [
    { icon:'✦', title:'Prompt profesional',            type:'prompt',         desc:'Genera un prompt de alta calidad para cualquier tarea con instrucciones precisas y variables marcadas con [VARIABLE]' },
    { icon:'📥', title:'Lead → CRM automático',         type:'n8n_flow',       desc:'Detectar nuevo lead en Typeform, añadirlo al CRM de AIWorkSuite via webhook y enviar email de bienvenida personalizado con IA' },
    { icon:'📄', title:'Factura tras cierre CRM',        type:'make_flow',      desc:'Cuando un cliente pasa a etapa "cerrado" en el CRM, generar factura PDF automáticamente y subirla a Google Drive en carpeta del cliente' },
    { icon:'📧', title:'Secuencia email post-propuesta', type:'automation',     desc:'Secuencia de 3 emails automáticos tras enviar propuesta: follow-up a 2 días, recordatorio a 5 días y cierre amigable a 10 días' },
    { icon:'🔔', title:'Alertas de pipeline por Slack',  type:'n8n_flow',       desc:'Notificar por Slack cuando un cliente cambia de etapa en el CRM, incluyendo resumen del cliente y próxima acción sugerida por IA' },
    { icon:'🐍', title:'Enrichment de leads (Python)',   type:'script_python',  desc:'Script Python que toma una lista de emails CSV, busca información pública de la empresa con Clearbit y Apollo.io y devuelve un CSV enriquecido' },
    { icon:'📊', title:'Reporte semanal automático',     type:'make_flow',      desc:'Cada lunes a las 9am generar reporte de KPIs de la semana anterior (nuevos leads, propuestas enviadas, cierres) y enviarlo por email' },
    { icon:'🤖', title:'Chatbot de cualificación',       type:'script_js',      desc:'Chatbot JavaScript para web que cualifica leads con 5 preguntas, puntúa según respuestas y añade al CRM si supera el umbral' },
    { icon:'⚡', title:'Webhook CRM → Google Sheets',   type:'n8n_flow',       desc:'Sincronizar en tiempo real los datos del CRM con Google Sheets: nuevos clientes, cambios de etapa y notas añadidas' },
  ];

  const TYPE_LABELS = {
    prompt:        'Prompt',
    n8n_flow:      'Flujo n8n',
    make_flow:     'Flujo Make',
    automation:    'Automatización',
    script_python: 'Script Python',
    script_js:     'Script JavaScript',
    guide:         'Guía',
    template:      'Plantilla',
  };

  const SYSTEM_PROMPTS = {
    prompt: `Eres un experto en prompt engineering para modelos de IA.
Genera un prompt profesional, completo y listo para usar según la descripción del usuario.
El prompt debe ser claro, con instrucciones precisas, ejemplos de uso y variables marcadas con [VARIABLE].
Formato de respuesta:
---PROMPT---
[El prompt completo aquí]
---FIN PROMPT---
---EXPLICACIÓN---
[Explicación de cómo usar el prompt, qué hace cada parte y cómo personalizarlo]
---FIN EXPLICACIÓN---`,

    n8n_flow: `Eres un experto en automatización con n8n.
Genera la descripción detallada de un flujo n8n para el caso de uso descrito.
Incluye: nodos necesarios en orden, configuración de cada nodo, cómo conectarlos, credenciales necesarias y casos de error a manejar.
También genera el JSON de ejemplo del flujo si es posible.
Formato claro con secciones: NODOS, CONFIGURACIÓN, JSON EJEMPLO, INSTRUCCIONES DE INSTALACIÓN.`,

    make_flow: `Eres un experto en automatización con Make (antes Integromat).
Genera la descripción detallada de un escenario Make para el caso de uso descrito.
Incluye: módulos necesarios, configuración de cada módulo, mapeo de datos entre módulos y manejo de errores.
Formato claro con secciones: MÓDULOS, CONFIGURACIÓN, INSTRUCCIONES.`,

    automation: `Eres un experto en automatización de procesos de negocio con IA.
Genera una especificación completa de automatización para el caso de uso descrito.
Incluye: descripción del flujo, herramientas recomendadas, pasos de implementación, código o configuración necesaria.`,

    script_python: `Eres un experto en Python y automatización con IA.
Genera un script Python completo, funcional y bien comentado para el caso de uso descrito.
Incluye: imports necesarios, función principal, manejo de errores, ejemplo de uso y requirements.txt si aplica.
El código debe estar listo para ejecutar con mínimas modificaciones.`,

    script_js: `Eres un experto en JavaScript/Node.js y automatización con IA.
Genera un script JavaScript/Node.js completo, funcional y bien comentado para el caso de uso descrito.
Incluye: imports/requires necesarios, función principal, manejo de errores, ejemplo de uso y package.json si aplica.
El código debe estar listo para ejecutar.`,

    guide: `Eres un experto en IA y automatización.
Genera una guía completa y práctica sobre el tema descrito.
La guía debe incluir: introducción, conceptos clave, paso a paso de implementación, ejemplos reales, errores comunes y recursos adicionales.
Formato estructurado en Markdown con títulos, listas y bloques de código donde aplique.`,

    template: `Eres un experto en productividad y automatización con IA.
Genera una plantilla completa y lista para usar para el caso de uso descrito.
La plantilla debe ser práctica, con variables claramente marcadas con [VARIABLE] y ejemplos de cómo rellenarla.
Incluye instrucciones de uso al final.`,
  };

  // ─── LÍMITES DE USO ────────────────────────────────────────────
  function autoUsageKey() {
    const d = new Date();
    return `prosp_auto_usage_${d.getFullYear()}_${d.getMonth()}`;
  }
  function autoGetUsage()        { return parseInt(localStorage.getItem(autoUsageKey()) || '0'); }
  function autoIncrementUsage()  { localStorage.setItem(autoUsageKey(), String(autoGetUsage() + 1)); }
  function autoCanGenerate()     {
    if (typeof USER_PLAN !== 'undefined' && USER_PLAN !== 'free') return true;
    return autoGetUsage() < 3;
  }
  function autoShowUpgrade()     {
    if (typeof showToast === 'function')
      showToast('Has alcanzado el límite de 3 recursos/mes. Actualiza tu plan para generar más.', 'warn', 5000);
  }

  // ─── INIT / SHOW ────────────────────────────────────────────────
  function init() {}

  function onShow() {
    const panel = document.getElementById('prospectly-auto-panel');
    if (!panel) return;
    if (!panel.innerHTML.trim()) renderForm(panel);
    updateBadge();
  }

  function updateBadge() {
    const b = document.getElementById('prospectly-auto-badge');
    if (b) b.textContent = `${autoGetUsage()}/3 recursos este mes`;
  }

  // ─── FORM ───────────────────────────────────────────────────────
  function renderForm(panel) {
    panel.innerHTML = `
      <div class="p-tool-wrap">
        <div class="p-tool-header">
          <h2>Generador de Automatizaciones</h2>
          <p>Genera prompts, flujos n8n/Make, scripts Python/JS, guías y plantillas listas para usar.</p>
        </div>

        <div class="p-form">
          <div class="p-form-group">
            <label class="lbl">Tipo de recurso</label>
            <div class="p-type-chips" id="auto-type-chips">
              ${Object.entries(TYPE_LABELS).map(([k, v]) =>
                `<button class="chip p-type-chip${k === 'prompt' ? ' sel' : ''}" data-type="${k}">${v}</button>`
              ).join('')}
            </div>
          </div>

          <div class="p-form-group">
            <label class="lbl" for="auto-description">Describe lo que necesitas</label>
            <div class="auto-templates-grid">
              ${TEMPLATES.map((t, i) =>
                `<button class="auto-tpl-btn" data-tpl="${i}" title="${t.desc}"><span class="auto-tpl-icon">${t.icon}</span><span class="auto-tpl-title">${t.title}</span></button>`
              ).join('')}
            </div>
            <textarea id="auto-description" class="inp" rows="4" placeholder="Ej: Un flujo n8n que monitoriza menciones de mi marca en Twitter y las guarda en Notion con resumen de sentimiento usando IA"></textarea>
          </div>

          <div class="p-form-row">
            <div class="p-form-group" id="auto-model-group">
              <label class="lbl" for="auto-model">Modelo IA objetivo <span style="opacity:.5">(opcional)</span></label>
              <input id="auto-model" class="inp" placeholder="GPT-4, Claude, Llama 3...">
            </div>
            <div class="p-form-group">
              <label class="lbl" for="auto-lang">Idioma de salida</label>
              <select id="auto-lang" class="inp">
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div class="p-form-group">
            <label class="lbl">Nivel</label>
            <div style="display:flex;gap:8px">
              <button class="chip sel" id="level-basic"    data-level="basic">Básico</button>
              <button class="chip"    id="level-advanced"  data-level="advanced">Avanzado</button>
            </div>
          </div>

          <button id="auto-generate-btn" class="btn btn-accent btn-full" style="font-size:15px;padding:12px">
            Generar recurso →
          </button>
          <div style="margin-top:10px;text-align:center;font-size:12px;color:var(--text3)" id="auto-usage-label">
            ${autoGetUsage()}/3 recursos usados este mes
          </div>
        </div>

        <div id="auto-result" style="display:none;margin-top:24px">
          <div class="p-result-topbar">
            <span class="tag tag-accent" id="auto-result-badge">Recurso</span>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-ghost btn-sm" id="auto-copy-btn">Copiar</button>
              <button class="btn btn-ghost btn-sm" id="auto-save-lib-btn">📚 Guardar en Biblioteca</button>
              <div style="display:flex;gap:4px">
                <button class="btn btn-ghost btn-sm" onclick="handleDownload('txt')">↓ .txt</button>
                <button class="btn btn-ghost btn-sm" onclick="handleDownload('py')">↓ .py</button>
                <button class="btn btn-ghost btn-sm" onclick="handleDownload('js')">↓ .js</button>
                <button class="btn btn-ghost btn-sm" onclick="handleDownload('md')">↓ .md</button>
                <button class="btn btn-ghost btn-sm" onclick="handleDownload('json')">↓ .json</button>
              </div>
            </div>
          </div>
          <div class="p-result-panel" id="auto-result-panel">
            <pre id="auto-result-code" class="p-result-code"></pre>
            <div id="auto-result-explanation" class="p-result-explanation"></div>
          </div>
        </div>
      </div>`;

    // Chips de tipo
    panel.querySelectorAll('.p-type-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('.p-type-chip').forEach(b => b.classList.remove('sel'));
        btn.classList.add('sel');
        currentType = btn.dataset.type;
        // Mostrar/ocultar campo modelo (solo para tipo prompt)
        const mg = document.getElementById('auto-model-group');
        if (mg) mg.style.display = currentType === 'prompt' ? '' : '';
      });
    });

    // Templates de ejemplo
    panel.querySelectorAll('.auto-tpl-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tpl = TEMPLATES[+btn.dataset.tpl];
        if (!tpl) return;
        // Seleccionar tipo
        panel.querySelectorAll('.p-type-chip').forEach(b => b.classList.remove('sel'));
        const typeBtn = panel.querySelector(`.p-type-chip[data-type="${tpl.type}"]`);
        if (typeBtn) typeBtn.classList.add('sel');
        currentType = tpl.type;
        // Rellenar descripción
        const ta = document.getElementById('auto-description');
        if (ta) { ta.value = tpl.desc; ta.focus(); }
        // Marcar template activo
        panel.querySelectorAll('.auto-tpl-btn').forEach(b => b.classList.remove('auto-tpl-active'));
        btn.classList.add('auto-tpl-active');
      });
    });

    // Chips de nivel
    panel.querySelectorAll('[data-level]').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('[data-level]').forEach(b => b.classList.remove('sel'));
        btn.classList.add('sel');
        currentLevel = btn.dataset.level;
      });
    });

    document.getElementById('auto-generate-btn')?.addEventListener('click', handleGenerate);
    document.getElementById('auto-copy-btn')?.addEventListener('click', () => {
      copyToClipboard(lastResult);
    });
    document.getElementById('auto-save-lib-btn')?.addEventListener('click', handleAutoSaveToLib);
  }

  // ─── GENERA ─────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!autoCanGenerate()) { autoShowUpgrade(); return; }

    const description = document.getElementById('auto-description')?.value?.trim();
    if (!description) {
      typeof showToast === 'function' && showToast('Describe lo que necesitas primero', 'warn');
      return;
    }

    const model = document.getElementById('auto-model')?.value?.trim();
    const lang  = document.getElementById('auto-lang')?.value || 'es';
    const system = SYSTEM_PROMPTS[currentType] || SYSTEM_PROMPTS.prompt;

    const userMsg = `Genera un ${TYPE_LABELS[currentType] || currentType} para el siguiente caso de uso:

${description}

${model ? `Modelo IA objetivo: ${model}` : ''}
Idioma: ${lang === 'en' ? 'English' : 'Español'}
Nivel: ${currentLevel === 'advanced' ? 'Avanzado — listo para producción, con manejo de errores, edge cases y buenas prácticas' : 'Básico — funcional y fácil de entender para empezar'}

Genera el recurso completo y listo para usar.`;

    const btn = document.getElementById('auto-generate-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Generando...'; }

    const resultEl  = document.getElementById('auto-result');
    const codeEl    = document.getElementById('auto-result-code');
    const explEl    = document.getElementById('auto-result-explanation');
    const badgeEl   = document.getElementById('auto-result-badge');

    if (resultEl)  resultEl.style.display = 'block';
    if (codeEl)    codeEl.textContent = 'Generando tu recurso...';
    if (explEl)    explEl.innerHTML = '';
    if (badgeEl)   badgeEl.textContent = TYPE_LABELS[currentType] || currentType;

    try {
      const response = await callAI(system, [{ role: 'user', content: userMsg }], 2500);
      lastResult = response;
      autoIncrementUsage();
      updateBadge();

      const codeMatch = response.match(/---PROMPT---([\s\S]*?)---FIN PROMPT---/);
      const explMatch = response.match(/---EXPLICACIÓN---([\s\S]*?)---FIN EXPLICACIÓN---/);

      if (codeMatch) {
        if (codeEl) codeEl.textContent = codeMatch[1].trim();
        if (explEl && explMatch) {
          explEl.innerHTML = '<strong style="display:block;margin-bottom:6px;font-size:12px;color:var(--text2)">Cómo usarlo</strong>' +
            explMatch[1].trim().replace(/\n/g, '<br>');
        }
      } else {
        if (codeEl) codeEl.textContent = response;
        if (explEl) explEl.innerHTML = '';
      }

      resultEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      if (codeEl) codeEl.textContent = `Error: ${err.message}`;
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Generar recurso →'; }
    }
  }

  // ─── GUARDAR EN BIBLIOTECA ─────────────────────────────────────
  function handleAutoSaveToLib() {
    if (!lastResult) return;
    const desc = document.getElementById('auto-description')?.value?.trim() || 'Recurso';
    const title = (TYPE_LABELS[currentType] || 'Recurso') + ': ' + desc.slice(0, 60);
    const items = typeof getLib === 'function' ? getLib() : [];
    items.unshift({
      id: typeof genId === 'function' ? genId() : Date.now().toString(36),
      type: 'automatizacion',
      title,
      content: lastResult,
      category: 'codigo',
      tags: ['automatizacion', currentType, ...desc.toLowerCase().split(/\s+/).slice(0, 3)],
      createdAt: typeof fmtDate === 'function' ? fmtDate() : new Date().toISOString().slice(0, 10),
      source: 'prospectly-auto',
      sourceId: null,
      metadata: { type: currentType, language: currentType === 'codigo' ? 'python' : 'text' }
    });
    if (typeof saveLib === 'function') saveLib(items);
    if (typeof renderLib === 'function') renderLib();
    typeof showToast === 'function' && showToast('Recurso guardado en Biblioteca', 'success');
  }

  function handleDownload(format) {
    if (!lastResult) return;
    const mimeTypes = {
      txt: 'text/plain',
      py: 'text/x-python',
      js: 'text/javascript',
      md: 'text/markdown',
      json: 'application/json'
    };
    const ext = format || 'txt';
    const content = ext === 'json'
      ? JSON.stringify({ recurso: lastResult, tipo: currentType, fecha: new Date().toISOString() }, null, 2)
      : lastResult;
    downloadBlob(content, 'prospectly-' + currentType + '-' + Date.now() + '.' + ext, mimeTypes[ext] || 'text/plain');
    typeof showToast === 'function' && showToast('Recurso descargado como .' + ext, 'success');
  }

  // Exponer handleDownload globalmente para los onclick de los botones de formato
  window.handleDownload = handleDownload;

  return { init, onShow };
})();


/* ──────────────────────────────────────────────────────────────
   UTILS COMPARTIDOS
────────────────────────────────────────────────────────────── */
function esc(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function copyToClipboard(text, btn, resetLabel) {
  const doIt = () => {
    if (btn) { btn.textContent = '¡Copiado!'; setTimeout(() => { btn.textContent = resetLabel || 'Copiar'; }, 2000); }
    typeof showToast === 'function' && showToast('Copiado al portapapeles', 'success');
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(doIt).catch(() => fallbackCopy(text, btn, resetLabel));
  } else {
    fallbackCopy(text, btn, resetLabel);
    doIt();
  }
}

function fallbackCopy(text, btn, resetLabel) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch { /* noop */ }
  document.body.removeChild(ta);
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


/* ──────────────────────────────────────────────────────────────
   REGISTRO GLOBAL
────────────────────────────────────────────────────────────── */
if (typeof window !== 'undefined') {
  window.ProspectlyB2B       = ProspectlyB2B;
  window.AutomatizacionesTool = AutomatizacionesTool;
  window.ProspectlyAuto       = AutomatizacionesTool;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ProspectlyB2B.init();
      AutomatizacionesTool.init();
    });
  } else {
    ProspectlyB2B.init();
    AutomatizacionesTool.init();
  }
}
