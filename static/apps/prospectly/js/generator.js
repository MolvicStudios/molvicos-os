import { callGroq } from './groq.js'

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
Incluye instrucciones de uso al final.`
}

export async function generateResource(type, description, model, lang, level) {
  const system = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.prompt

  const userMsg = `Genera un ${type} para el siguiente caso de uso:

${description}

${model ? `Modelo IA objetivo: ${model}` : ''}
Idioma: ${lang === 'en' ? 'English' : 'Español'}
Nivel: ${level === 'advanced' ? 'Avanzado — listo para producción, con manejo de errores, edge cases y buenas prácticas' : 'Básico — funcional y fácil de entender para empezar'}

Genera el recurso completo y listo para usar.`

  return await callGroq([{ role: 'user', content: userMsg }], system)
}

export function renderGeneratorResult(response, type, container, badgeEl) {
  const typeLabels = {
    prompt: 'Prompt', n8n_flow: 'Flujo n8n', make_flow: 'Flujo Make',
    automation: 'Automatización', script_python: 'Script Python',
    script_js: 'Script JavaScript', guide: 'Guía', template: 'Plantilla'
  }

  badgeEl.textContent = typeLabels[type] || type

  const codeMatch = response.match(/---PROMPT---([\s\S]*?)---FIN PROMPT---/)
  const explMatch = response.match(/---EXPLICACIÓN---([\s\S]*?)---FIN EXPLICACIÓN---/)

  const codeEl = container.querySelector('#gen-result-code')
  const explEl = container.querySelector('#gen-result-explanation')

  if (codeMatch) {
    codeEl.textContent = codeMatch[1].trim()
    if (explMatch) {
      explEl.textContent = ''
      explEl.innerHTML = explMatch[1].trim().replace(/\n/g, '<br>')
    } else {
      explEl.innerHTML = ''
    }
  } else {
    codeEl.textContent = response
    explEl.innerHTML = ''
  }
}
