import { generateResource, renderGeneratorResult } from './generator.js'
import { generateProspectingKit, renderProspectingKit } from './prospecting.js'
import { exportGeneratorPDF, exportProspectingPDF } from './export.js'
import LicenseSystem from './license.js'
import { showUpgradeModal } from './upgrade-modal.js'

let currentResourceType = 'prompt'
let currentLevel = 'basic'
let lastGeneratedResource = ''
let lastProspectingData = null

const ADVANCED_TYPES = ['n8n_flow', 'make_flow', 'script_python', 'script_js']

function getDailyCount(action) {
  const key = `prospectly_daily_${action}_${new Date().toISOString().slice(0,10)}`
  return parseInt(localStorage.getItem(key) || '0')
}
function incrementDailyCount(action) {
  const key = `prospectly_daily_${action}_${new Date().toISOString().slice(0,10)}`
  localStorage.setItem(key, getDailyCount(action) + 1)
}

function updateProUI() {
  const isPro = LicenseSystem.isPro()
  const plan = LicenseSystem.getPlan()

  const badge = document.getElementById('pro-badge')
  if (badge) {
    badge.textContent = isPro ? '✅ Pro' : '🔒 Free'
    badge.className = isPro ? 'badge badge--pro' : 'badge badge--free'
  }

  document.querySelectorAll('[data-pro]').forEach(el => {
    el.classList.toggle('locked', !isPro)
  })
}

window.addEventListener('prospectly-pro-changed', updateProUI)

// ===== NAVEGACIÓN =====
function switchSection(name) {
  document.querySelectorAll('.app-section').forEach(s => s.classList.remove('active'))
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'))
  document.getElementById(`section-${name}`)?.classList.add('active')
  document.querySelector(`[data-section="${name}"]`)?.classList.add('active')
}

document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => switchSection(tab.dataset.section))
})

window.switchSection = switchSection

// ===== TIPO DE RECURSO =====
document.querySelectorAll('.resource-type').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.resource-type').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    currentResourceType = btn.dataset.type
  })
})

// ===== NIVEL =====
document.querySelectorAll('.level-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    currentLevel = btn.dataset.level
  })
})

// ===== GENERAR RECURSO =====
document.getElementById('btn-generate-resource')?.addEventListener('click', async () => {
  // Pro guard: advanced types require Pro
  if (!LicenseSystem.isPro() && ADVANCED_TYPES.includes(currentResourceType)) {
    showUpgradeModal('generate_advanced')
    return
  }
  // Pro guard: advanced level requires Pro
  if (!LicenseSystem.isPro() && currentLevel === 'advanced') {
    showUpgradeModal('advanced_mode')
    return
  }
  // Pro guard: daily limit for free users
  if (!LicenseSystem.isPro()) {
    if (getDailyCount('generate') >= 3) {
      showUpgradeModal('generate_limit')
      return
    }
    incrementDailyCount('generate')
  }

  const btn = document.getElementById('btn-generate-resource')
  const description = document.getElementById('gen-description')?.value
  if (!description?.trim()) return alert('Describe lo que necesitas primero')

  const model = document.getElementById('gen-model')?.value
  const lang  = document.getElementById('gen-lang')?.value
  const placeholder = document.querySelector('.result-placeholder')
  const resultContent = document.getElementById('gen-result-content')
  const code = document.getElementById('gen-result-code')

  btn.disabled = true
  btn.textContent = 'Generando...'
  if (placeholder) placeholder.style.display = 'none'
  resultContent.style.display = 'block'
  code.textContent = 'Generando tu recurso...'

  try {
    const response = await generateResource(
      currentResourceType, description, model, lang, currentLevel
    )
    lastGeneratedResource = response
    renderGeneratorResult(
      response,
      currentResourceType,
      document.getElementById('gen-result-panel'),
      document.getElementById('result-type-badge')
    )
    window.molvicTrack && window.molvicTrack('resource_generated')
  } catch(err) {
    code.textContent = `Error: ${err.message}`
  } finally {
    btn.disabled = false
    btn.textContent = 'Generar recurso →'
  }
})

// ===== GENERAR KIT PROSPECCIÓN =====
document.getElementById('btn-generate-prosp')?.addEventListener('click', async () => {
  // Pro guard: daily limit for free users
  if (!LicenseSystem.isPro()) {
    if (getDailyCount('generate') >= 3) {
      showUpgradeModal('generate_limit')
      return
    }
    incrementDailyCount('generate')
  }

  const btn = document.getElementById('btn-generate-prosp')
  const target = document.getElementById('prosp-target')?.value
  const offer  = document.getElementById('prosp-offer')?.value
  if (!target?.trim() || !offer?.trim()) return alert('Rellena el cliente objetivo y lo que vendes')

  const sector  = document.getElementById('prosp-sector')?.value
  const channel = document.getElementById('prosp-channel')?.value
  const options = {
    icp:        document.getElementById('gen-icp')?.checked,
    email:      document.getElementById('gen-email')?.checked,
    linkedin:   document.getElementById('gen-linkedin')?.checked,
    script:     document.getElementById('gen-script')?.checked,
    objections: document.getElementById('gen-objections')?.checked,
    followup:   document.getElementById('gen-followup')?.checked
  }

  btn.disabled = true
  btn.textContent = 'Generando kit...'

  const result = document.getElementById('prosp-result')
  const content = document.getElementById('prosp-result-content')
  result.style.display = 'block'
  content.innerHTML = '<div class="loading-kit">Generando tu kit de prospección personalizado...</div>'

  try {
    const data = await generateProspectingKit(target, offer, sector, channel, options)
    lastProspectingData = data
    renderProspectingKit(data, options, content)
    result.scrollIntoView({ behavior: 'smooth' })
    window.molvicTrack && window.molvicTrack('kit_generated')
  } catch(err) {
    content.innerHTML = `<div class="error-msg">Error: ${err.message}</div>`
  } finally {
    btn.disabled = false
    btn.textContent = 'Generar kit de prospección →'
  }
})

// ===== ACCIONES GLOBALES =====

// Copiar resultado generador
window.copyGenResult = function() {
  navigator.clipboard.writeText(lastGeneratedResource)
    .then(() => alert('¡Copiado al portapapeles!'))
}

// Descargar .txt
window.downloadGenResult = function() {
  const blob = new Blob([lastGeneratedResource], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `prospectly-${currentResourceType}-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

// Exportar PDFs
window.exportGenPDF = function() {
  if (!LicenseSystem.isPro()) { showUpgradeModal('export'); return }
  exportGeneratorPDF(lastGeneratedResource, currentResourceType)
}

window.exportProspPDF = function() {
  if (!LicenseSystem.isPro()) { showUpgradeModal('export'); return }
  if (lastProspectingData) exportProspectingPDF(lastProspectingData)
}

// ===== SHARE =====
const SHARE_TEXT = 'He generado mi kit de prospección B2B en Prospectly.shop'
const SHARE_URL = 'https://prospectly.shop'

window.shareWhatsApp = function() {
  window.open(`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT + ' ' + SHARE_URL)}`, '_blank', 'noopener')
}

window.shareTwitter = function() {
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}`, '_blank', 'noopener')
}

window.shareURL = function() {
  navigator.clipboard.writeText(SHARE_URL).then(() => showToast('¡Enlace copiado!'))
}

// ===== TOAST =====
function showToast(msg) {
  const toast = document.getElementById('toast')
  if (!toast) return
  toast.textContent = msg
  toast.classList.add('visible')
  setTimeout(() => toast.classList.remove('visible'), 2500)
}

// ===== FEEDBACK =====
window.sendFeedback = function(section, vote) {
  const key = 'prospectly_feedback'
  const data = JSON.parse(localStorage.getItem(key) || '{}')
  data[section] = { vote, timestamp: Date.now() }
  localStorage.setItem(key, JSON.stringify(data))

  // Highlight selected button
  const block = document.getElementById(`feedback-${section}`)
  if (block) {
    block.querySelectorAll('.feedback-btns button').forEach(b => b.classList.remove('selected'))
    const idx = vote === 'up' ? 0 : 1
    block.querySelectorAll('.feedback-btns button')[idx]?.classList.add('selected')
  }

  if (vote === 'down') {
    const textBlock = document.getElementById(`feedback-${section}-text`)
    if (textBlock) textBlock.style.display = 'flex'
  }

  showToast(vote === 'up' ? '¡Gracias por tu feedback!' : 'Cuéntanos cómo mejorar')
}

window.submitFeedback = function(section) {
  const msg = document.getElementById(`feedback-${section}-msg`)?.value
  if (!msg?.trim()) return

  const key = 'prospectly_feedback'
  const data = JSON.parse(localStorage.getItem(key) || '{}')
  if (data[section]) data[section].message = msg.trim()
  localStorage.setItem(key, JSON.stringify(data))

  const textBlock = document.getElementById(`feedback-${section}-text`)
  if (textBlock) textBlock.style.display = 'none'
  showToast('¡Gracias! Tu comentario ha sido guardado.')
}

// ===== SHOW PROSP EXTRAS AFTER GENERATION =====
const origProspHandler = document.getElementById('btn-generate-prosp')
if (origProspHandler) {
  const result = document.getElementById('prosp-result')
  const observer = new MutationObserver(() => {
    const content = document.getElementById('prosp-result-content')
    if (content && content.children.length > 0 && !content.querySelector('.loading-kit') && !content.querySelector('.error-msg')) {
      document.getElementById('prosp-ai-indicator')?.style.setProperty('display', 'flex')
      document.getElementById('prosp-share')?.style.setProperty('display', 'flex')
      document.getElementById('feedback-prosp')?.style.setProperty('display', 'block')
    }
  })
  if (result) observer.observe(result, { childList: true, subtree: true })
}

// ===== LEVEL GUARD =====
document.querySelectorAll('.level-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    if (btn.dataset.level === 'advanced' && !LicenseSystem.isPro()) {
      e.stopImmediatePropagation()
      showUpgradeModal('advanced_mode')
      return
    }
  })
}, true)

// ===== INIT LICENSE =====
LicenseSystem.refresh().then(() => updateProUI())

