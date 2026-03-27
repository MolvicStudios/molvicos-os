import LicenseSystem from './license.js'

const FEATURE_COPY = {
  generate_advanced: {
    icon: '⚙️',
    title: 'Generación avanzada',
    desc: 'Flujos n8n/Make, scripts Python/JS y plantillas premium'
  },
  export: {
    icon: '📦',
    title: 'Exportar resultados',
    desc: 'Descarga todos tus resultados en un clic'
  },
  advanced_mode: {
    icon: '🎛️',
    title: 'Modo avanzado',
    desc: 'Parámetros detallados para resultados más precisos'
  },
  generate_limit: {
    icon: '⚡',
    title: 'Límite diario alcanzado',
    desc: 'Has usado tus 3 generaciones gratuitas de hoy'
  }
}

const MONTHLY_URL = 'https://molvicstudios.lemonsqueezy.com/checkout/buy/1450628'
const ANNUAL_URL  = 'https://molvicstudios.lemonsqueezy.com/checkout/buy/1455073'

function createModal(feature) {
  const copy = FEATURE_COPY[feature] || FEATURE_COPY.generate_advanced
  const isDark = true // always dark theme

  const overlay = document.createElement('div')
  overlay.id = 'upgrade-modal-overlay'
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:99999;
    background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);
    display:flex;align-items:center;justify-content:center;
    opacity:0;transition:opacity .3s ease;
  `

  const card = document.createElement('div')
  card.style.cssText = `
    background:#1A1F35;color:#F1F5F9;
    border:1px solid rgba(255,255,255,0.1);
    border-radius:16px;max-width:480px;width:calc(100% - 2rem);
    padding:2rem;box-shadow:0 24px 48px rgba(0,0,0,0.4);
    transform:translateY(20px);transition:transform .3s ease;
    font-family:'Plus Jakarta Sans',system-ui,sans-serif;
  `

  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:1.5rem">
      <div>
        <div style="font-size:1.5rem;margin-bottom:0.25rem">🚀 Función Pro</div>
      </div>
      <button id="upgrade-modal-close" style="
        background:none;border:none;color:#94A3B8;font-size:1.5rem;cursor:pointer;
        padding:0;line-height:1;
      ">&times;</button>
    </div>

    <div style="
      background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);
      border-radius:12px;padding:1rem;margin-bottom:1.5rem;
      display:flex;align-items:center;gap:0.75rem;
    ">
      <span style="font-size:1.75rem">${copy.icon}</span>
      <div>
        <div style="font-weight:600;font-size:1rem">${copy.title}</div>
        <div style="color:#94A3B8;font-size:0.875rem">${copy.desc}</div>
      </div>
    </div>

    <p style="color:#94A3B8;margin-bottom:1rem;font-size:0.9rem">
      Esta función requiere <strong style="color:#818CF8">Prospectly Pro</strong>
    </p>

    <ul style="list-style:none;padding:0;margin:0 0 1.5rem;display:flex;flex-direction:column;gap:0.5rem">
      <li style="display:flex;align-items:center;gap:0.5rem;font-size:0.9rem">✅ Generaciones ilimitadas</li>
      <li style="display:flex;align-items:center;gap:0.5rem;font-size:0.9rem">✅ Flujos n8n/Make y scripts</li>
      <li style="display:flex;align-items:center;gap:0.5rem;font-size:0.9rem">✅ Kit B2B completo</li>
      <li style="display:flex;align-items:center;gap:0.5rem;font-size:0.9rem">✅ Exportación ilimitada</li>
      <li style="display:flex;align-items:center;gap:0.5rem;font-size:0.9rem">✅ Modo avanzado</li>
    </ul>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem;margin-top:0.25rem">
    <a href="${MONTHLY_URL}" target="_blank" rel="noopener" style="
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.35);
      border-radius:10px;padding:1rem 0.75rem;text-decoration:none;color:#F1F5F9;
      transition:border-color .2s,background .2s;gap:0.2rem;
    " onmouseover="this.style.borderColor='#818CF8';this.style.background='rgba(99,102,241,0.22)'"
       onmouseout="this.style.borderColor='rgba(99,102,241,0.35)';this.style.background='rgba(99,102,241,0.12)'">
      <span style="font-size:0.75rem;color:#94A3B8;text-transform:uppercase;letter-spacing:.05em">Mensual</span>
      <span style="font-size:1.4rem;font-weight:700;color:#818CF8">desde 2,99€</span>
      <span style="font-size:0.75rem;color:#94A3B8">paga lo que quieras</span>
    </a>

    <a href="${ANNUAL_URL}" target="_blank" rel="noopener" style="
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.4);
      border-radius:10px;padding:1rem 0.75rem;text-decoration:none;color:#F1F5F9;
      transition:border-color .2s,background .2s;gap:0.2rem;position:relative;
    " onmouseover="this.style.borderColor='#34D399';this.style.background='rgba(16,185,129,0.2)'"
       onmouseout="this.style.borderColor='rgba(16,185,129,0.4)';this.style.background='rgba(16,185,129,0.1)'">
      <span style="
        position:absolute;top:-10px;left:50%;transform:translateX(-50%);
        background:#10B981;color:#fff;font-size:0.65rem;font-weight:700;
        padding:2px 8px;border-radius:20px;white-space:nowrap;letter-spacing:.04em;text-transform:uppercase;
      ">⭐ Mejor precio</span>
      <span style="font-size:0.75rem;color:#94A3B8;text-transform:uppercase;letter-spacing:.05em">Anual</span>
      <span style="font-size:1.4rem;font-weight:700;color:#34D399">desde 29€</span>
      <span style="font-size:0.75rem;color:#94A3B8">paga lo que quieras</span>
    </a>
    </div>

    <button id="upgrade-modal-toggle-key" style="
      display:block;width:100%;background:none;border:none;
      color:#94A3B8;font-size:0.85rem;cursor:pointer;
      padding:0.5rem;text-decoration:underline;
    ">Ya tengo una licencia</button>

    <div id="upgrade-modal-key-section" style="display:none;margin-top:1rem">
      <div style="display:flex;gap:0.5rem">
        <input id="upgrade-modal-key-input" type="text" placeholder="Pega tu clave de licencia aquí" style="
          flex:1;background:#0D0F1A;border:1px solid rgba(255,255,255,0.15);
          color:#F1F5F9;padding:0.65rem 0.75rem;border-radius:8px;
          font-size:0.875rem;font-family:inherit;outline:none;
        " />
        <button id="upgrade-modal-activate-btn" style="
          background:#10B981;color:#fff;border:none;padding:0.65rem 1.25rem;
          border-radius:8px;font-weight:600;cursor:pointer;font-size:0.875rem;
          white-space:nowrap;
        ">Activar</button>
      </div>
      <div id="upgrade-modal-key-msg" style="
        margin-top:0.5rem;font-size:0.825rem;min-height:1.25rem;
      "></div>
    </div>
  `

  overlay.appendChild(card)
  return overlay
}

export function showUpgradeModal(feature) {
  // Remove existing modal
  document.getElementById('upgrade-modal-overlay')?.remove()

  const modal = createModal(feature)
  document.body.appendChild(modal)

  // Trigger animation
  requestAnimationFrame(() => {
    modal.style.opacity = '1'
    modal.querySelector('div').nextElementSibling || null
    const card = modal.firstElementChild
    if (card) card.style.transform = 'translateY(0)'
  })

  function closeModal() {
    modal.style.opacity = '0'
    setTimeout(() => modal.remove(), 300)
  }

  // Close button
  modal.querySelector('#upgrade-modal-close').addEventListener('click', closeModal)

  // Click outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal()
  })

  // Escape key
  const onEsc = (e) => {
    if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onEsc) }
  }
  document.addEventListener('keydown', onEsc)

  // Toggle license key section
  modal.querySelector('#upgrade-modal-toggle-key').addEventListener('click', () => {
    const section = modal.querySelector('#upgrade-modal-key-section')
    section.style.display = section.style.display === 'none' ? 'block' : 'none'
    if (section.style.display === 'block') {
      modal.querySelector('#upgrade-modal-key-input').focus()
    }
  })

  // Activate button
  modal.querySelector('#upgrade-modal-activate-btn').addEventListener('click', async () => {
    const input = modal.querySelector('#upgrade-modal-key-input')
    const msgEl = modal.querySelector('#upgrade-modal-key-msg')
    const btn = modal.querySelector('#upgrade-modal-activate-btn')
    const key = input.value.trim()

    btn.disabled = true
    btn.textContent = 'Verificando...'
    msgEl.style.color = '#94A3B8'
    msgEl.textContent = 'Verificando licencia...'

    const result = await LicenseSystem.activate(key)

    if (result.success) {
      msgEl.style.color = '#10B981'
      msgEl.textContent = '✅ ¡Licencia Pro activada!'
      setTimeout(() => {
        closeModal()
        // Dispatch event so app.js can update UI
        window.dispatchEvent(new CustomEvent('prospectly-pro-changed'))
      }, 1200)
    } else {
      msgEl.style.color = '#EF4444'
      msgEl.textContent = `❌ ${result.error}`
      btn.disabled = false
      btn.textContent = 'Activar'
    }
  })

  // Enter key on input
  modal.querySelector('#upgrade-modal-key-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') modal.querySelector('#upgrade-modal-activate-btn').click()
  })
}
