// ===== ONBOARDING FIRST VISIT =====
const ONBOARDING_KEY = 'prospectly_onboarding_done'

const STEPS = [
  { selector: '#gen-description', text: '1/3 — Describe aquí lo que necesitas: un prompt, flujo n8n, script…', position: 'bottom' },
  { selector: '#btn-generate-resource', text: '2/3 — Pulsa este botón y la IA lo genera al instante', position: 'top' },
  { selector: '#gen-result-panel', text: '3/3 — Aquí aparecerá tu recurso. Puedes copiarlo, descargarlo o exportar a PDF', position: 'top' }
]

let currentStep = 0

function startOnboarding() {
  if (localStorage.getItem(ONBOARDING_KEY)) return
  currentStep = 0
  showStep()
}

function showStep() {
  removeOverlay()
  if (currentStep >= STEPS.length) {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    return
  }

  const step = STEPS[currentStep]
  const target = document.querySelector(step.selector)
  if (!target) { currentStep++; showStep(); return }

  // Overlay
  const overlay = document.createElement('div')
  overlay.className = 'onboarding-overlay'
  overlay.id = 'onboarding-overlay'
  document.body.appendChild(overlay)

  // Highlight target
  target.classList.add('onboarding-highlight')

  // Tooltip
  const tooltip = document.createElement('div')
  tooltip.className = 'onboarding-tooltip'
  tooltip.id = 'onboarding-tooltip'
  tooltip.innerHTML = `
    <p>${step.text}</p>
    <div class="onboarding-actions">
      <button class="onboarding-skip" onclick="skipOnboarding()">Saltar</button>
      <button class="onboarding-next" onclick="nextOnboardingStep()">${currentStep < STEPS.length - 1 ? 'Siguiente →' : '¡Entendido!'}</button>
    </div>
  `
  document.body.appendChild(tooltip)

  // Position tooltip
  const rect = target.getBoundingClientRect()
  const tooltipRect = tooltip.getBoundingClientRect()
  if (step.position === 'bottom') {
    tooltip.style.top = (rect.bottom + window.scrollY + 12) + 'px'
  } else {
    tooltip.style.top = (rect.top + window.scrollY - tooltipRect.height - 12) + 'px'
  }
  tooltip.style.left = Math.max(16, Math.min(
    rect.left + rect.width / 2 - tooltipRect.width / 2,
    window.innerWidth - tooltipRect.width - 16
  )) + 'px'

  target.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function nextOnboardingStep() {
  currentStep++
  showStep()
}

function skipOnboarding() {
  removeOverlay()
  localStorage.setItem(ONBOARDING_KEY, 'true')
}

function removeOverlay() {
  document.getElementById('onboarding-overlay')?.remove()
  document.getElementById('onboarding-tooltip')?.remove()
  document.querySelectorAll('.onboarding-highlight').forEach(el => el.classList.remove('onboarding-highlight'))
}

window.nextOnboardingStep = nextOnboardingStep
window.skipOnboarding = skipOnboarding

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(startOnboarding, 800)
})
