import { callGroq } from './groq.js'

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
    {
      "dia": 3,
      "canal": "email",
      "mensaje": "Mensaje de seguimiento día 3"
    },
    {
      "dia": 7,
      "canal": "linkedin",
      "mensaje": "Mensaje LinkedIn día 7"
    },
    {
      "dia": 14,
      "canal": "email",
      "mensaje": "Último intento día 14"
    }
  ]
}

No escribas nada fuera del JSON. Sin markdown, sin backticks. Sin comentarios.`

export async function generateProspectingKit(target, offer, sector, channel, options) {
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

Personaliza todo al máximo según el cliente objetivo y la oferta. Que sea directo, sin clichés y listo para usar hoy.`

  const response = await callGroq([{ role: 'user', content: userMsg }], SYSTEM_PROSPECTING)

  try {
    const clean = response.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    throw new Error('Error al generar el kit. Inténtalo de nuevo.')
  }
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

export function renderProspectingKit(data, options, container) {
  let html = ''

  if (options.icp && data.icp) {
    html += `
      <div class="prosp-section">
        <h3>🎯 Perfil de cliente ideal (ICP)</h3>
        <div class="prosp-card">
          <p><strong>Descripción:</strong> ${escapeHtml(data.icp.descripcion)}</p>
          <p><strong>Tamaño empresa:</strong> ${escapeHtml(data.icp.tamano_empresa)}</p>
          <p><strong>Decisor:</strong> ${escapeHtml(data.icp.cargo_decision)}</p>
          <p><strong>Propuesta de valor:</strong> <em>${escapeHtml(data.icp.mensaje_valor)}</em></p>
          <div class="prosp-lists">
            <div>
              <strong>Dolores principales:</strong>
              <ul>${data.icp.dolores_principales.map(d => `<li>${escapeHtml(d)}</li>`).join('')}</ul>
            </div>
            <div>
              <strong>Señales de compra:</strong>
              <ul>${data.icp.senales_compra.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
            </div>
            <div>
              <strong>Dónde encontrarlos:</strong>
              <ul>${data.icp.donde_encontrarlos.map(l => `<li>${escapeHtml(l)}</li>`).join('')}</ul>
            </div>
          </div>
        </div>
      </div>`
  }

  if (options.email && data.email_frio) {
    const emails = [
      { asunto: data.email_frio.asunto_1, cuerpo: data.email_frio.cuerpo_1, label: 'Directo (basado en dolor)' },
      { asunto: data.email_frio.asunto_2, cuerpo: data.email_frio.cuerpo_2, label: 'Curiosidad' },
      { asunto: data.email_frio.asunto_3, cuerpo: data.email_frio.cuerpo_3, label: 'Basado en resultado' }
    ]
    html += `
      <div class="prosp-section">
        <h3>📧 Emails en frío</h3>
        ${emails.map((e, i) => `
          <div class="prosp-card email-card">
            <div class="email-header">
              <span class="email-label">Opción ${i+1}: ${escapeHtml(e.label)}</span>
              <button class="copy-email-btn" data-index="${i}">Copiar</button>
            </div>
            <p class="email-subject"><strong>Asunto:</strong> ${escapeHtml(e.asunto)}</p>
            <pre class="email-body">${escapeHtml(e.cuerpo)}</pre>
          </div>
        `).join('')}
      </div>`
  }

  if (options.linkedin && data.linkedin) {
    html += `
      <div class="prosp-section">
        <h3>💼 Mensajes LinkedIn</h3>
        <div class="prosp-card">
          <div class="linkedin-msg">
            <strong>Solicitud de conexión:</strong>
            <div class="msg-box">${escapeHtml(data.linkedin.connection_request)}</div>
          </div>
          <div class="linkedin-msg">
            <strong>Primer mensaje:</strong>
            <div class="msg-box">${escapeHtml(data.linkedin.primer_mensaje)}</div>
          </div>
          <div class="linkedin-msg">
            <strong>Follow-up:</strong>
            <div class="msg-box">${escapeHtml(data.linkedin.followup_mensaje)}</div>
          </div>
        </div>
      </div>`
  }

  if (options.script && data.script_llamada) {
    const s = data.script_llamada
    html += `
      <div class="prosp-section">
        <h3>📞 Script de llamada</h3>
        <div class="prosp-card">
          <div class="script-block"><strong>Apertura:</strong><p>${escapeHtml(s.apertura)}</p></div>
          <div class="script-block"><strong>Gancho:</strong><p>${escapeHtml(s.gancho)}</p></div>
          <div class="script-block">
            <strong>Preguntas de descubrimiento:</strong>
            <ol>${s.descubrimiento.map(q => `<li>${escapeHtml(q)}</li>`).join('')}</ol>
          </div>
          <div class="script-block"><strong>Pitch 30s:</strong><p>${escapeHtml(s.pitch)}</p></div>
          <div class="script-block"><strong>Cierre:</strong><p>${escapeHtml(s.cierre)}</p></div>
        </div>
      </div>`
  }

  if (options.objections && data.objeciones) {
    html += `
      <div class="prosp-section">
        <h3>🛡️ Manejo de objeciones</h3>
        ${data.objeciones.map(o => `
          <div class="prosp-card objection-card">
            <p class="objection-text">❝ ${escapeHtml(o.objecion)} ❞</p>
            <p><strong>Respuesta:</strong> ${escapeHtml(o.respuesta)}</p>
            <p class="objection-redirect"><strong>Redirección:</strong> ${escapeHtml(o.redireccion)}</p>
          </div>
        `).join('')}
      </div>`
  }

  if (options.followup && data.followup_secuencia) {
    html += `
      <div class="prosp-section">
        <h3>📅 Secuencia de follow-up</h3>
        <div class="followup-timeline">
          ${data.followup_secuencia.map(f => `
            <div class="followup-item">
              <div class="followup-day">Día ${escapeHtml(String(f.dia))}</div>
              <div class="followup-channel">${escapeHtml(f.canal)}</div>
              <div class="followup-msg">${escapeHtml(f.mensaje)}</div>
            </div>
          `).join('')}
        </div>
      </div>`
  }

  html += `
    <div class="prosp-cta">
      <p>¿Prefieres que lo hagamos nosotros?</p>
      <a href="https://molvicstudios.pro" target="_blank" rel="noopener">Contacta con MolvicStudios.pro →</a>
    </div>`

  container.innerHTML = html

  // Attach copy handlers via event delegation
  container.querySelectorAll('.copy-email-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10)
      const emails = [
        { asunto: data.email_frio.asunto_1, cuerpo: data.email_frio.cuerpo_1 },
        { asunto: data.email_frio.asunto_2, cuerpo: data.email_frio.cuerpo_2 },
        { asunto: data.email_frio.asunto_3, cuerpo: data.email_frio.cuerpo_3 }
      ]
      const e = emails[idx]
      if (e) {
        navigator.clipboard.writeText(`Asunto: ${e.asunto}\n\n${e.cuerpo}`)
          .then(() => {
            btn.textContent = '¡Copiado!'
            setTimeout(() => { btn.textContent = 'Copiar' }, 2000)
          })
      }
    })
  })
}
