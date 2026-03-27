/* global jspdf */

function getJsPDF() {
  const lib = window.jspdf
  if (lib && lib.jsPDF) return lib.jsPDF
  throw new Error('jsPDF no disponible. Recarga la página.')
}

export function exportGeneratorPDF(content, type) {
  if (!content) return alert('No hay contenido para exportar.')

  const jsPDF = getJsPDF()
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const typeLabels = {
    prompt: 'Prompt', n8n_flow: 'Flujo n8n', make_flow: 'Flujo Make',
    automation: 'Automatización', script_python: 'Script Python',
    script_js: 'Script JavaScript', guide: 'Guía', template: 'Plantilla'
  }

  const margin = 15
  const pageWidth = doc.internal.pageSize.getWidth() - margin * 2
  let y = 20

  // Header
  doc.setFontSize(18)
  doc.setTextColor(99, 102, 241)
  doc.text('Prospectly.shop', margin, y)
  y += 8

  doc.setFontSize(12)
  doc.setTextColor(148, 163, 184)
  doc.text(`${typeLabels[type] || type} — Generado con IA`, margin, y)
  y += 12

  // Separator
  doc.setDrawColor(99, 102, 241)
  doc.setLineWidth(0.5)
  doc.line(margin, y, margin + pageWidth, y)
  y += 10

  // Content
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  const lines = doc.splitTextToSize(content, pageWidth)

  for (const line of lines) {
    if (y > 275) {
      doc.addPage()
      y = 20
    }
    doc.text(line, margin, y)
    y += 5
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('prospectly.shop — by MolvicStudios.pro', margin, 290)
    doc.text(`${i} / ${pageCount}`, doc.internal.pageSize.getWidth() - margin - 10, 290)
  }

  doc.save(`prospectly-${type}-${Date.now()}.pdf`)
}

export function exportProspectingPDF(data) {
  if (!data) return alert('No hay datos para exportar.')

  const jsPDF = getJsPDF()
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const margin = 15
  const pageWidth = doc.internal.pageSize.getWidth() - margin * 2
  let y = 20

  // Header
  doc.setFontSize(18)
  doc.setTextColor(16, 185, 129)
  doc.text('Prospectly.shop — Kit de Prospección B2B', margin, y)
  y += 10
  doc.setDrawColor(16, 185, 129)
  doc.setLineWidth(0.5)
  doc.line(margin, y, margin + pageWidth, y)
  y += 10

  function addSection(title, content) {
    if (y > 260) { doc.addPage(); y = 20 }
    doc.setFontSize(13)
    doc.setTextColor(99, 102, 241)
    doc.text(title, margin, y)
    y += 8
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    const lines = doc.splitTextToSize(content, pageWidth)
    for (const line of lines) {
      if (y > 275) { doc.addPage(); y = 20 }
      doc.text(line, margin, y)
      y += 5
    }
    y += 6
  }

  // ICP
  if (data.icp) {
    let icpText = `Descripción: ${data.icp.descripcion}\n`
    icpText += `Tamaño: ${data.icp.tamano_empresa}\n`
    icpText += `Decisor: ${data.icp.cargo_decision}\n`
    icpText += `Propuesta de valor: ${data.icp.mensaje_valor}\n\n`
    icpText += `Dolores principales:\n${data.icp.dolores_principales.map(d => `  • ${d}`).join('\n')}\n\n`
    icpText += `Señales de compra:\n${data.icp.senales_compra.map(s => `  • ${s}`).join('\n')}\n\n`
    icpText += `Dónde encontrarlos:\n${data.icp.donde_encontrarlos.map(l => `  • ${l}`).join('\n')}`
    addSection('Perfil de Cliente Ideal (ICP)', icpText)
  }

  // Emails
  if (data.email_frio) {
    const emails = [
      { a: data.email_frio.asunto_1, c: data.email_frio.cuerpo_1 },
      { a: data.email_frio.asunto_2, c: data.email_frio.cuerpo_2 },
      { a: data.email_frio.asunto_3, c: data.email_frio.cuerpo_3 }
    ]
    emails.forEach((e, i) => {
      addSection(`Email en frío — Opción ${i + 1}`, `Asunto: ${e.a}\n\n${e.c}`)
    })
  }

  // LinkedIn
  if (data.linkedin) {
    const lk = data.linkedin
    addSection('Mensajes LinkedIn',
      `Solicitud de conexión:\n${lk.connection_request}\n\nPrimer mensaje:\n${lk.primer_mensaje}\n\nFollow-up:\n${lk.followup_mensaje}`)
  }

  // Script
  if (data.script_llamada) {
    const s = data.script_llamada
    let text = `Apertura: ${s.apertura}\n\nGancho: ${s.gancho}\n\n`
    text += `Preguntas:\n${s.descubrimiento.map((q, i) => `  ${i+1}. ${q}`).join('\n')}\n\n`
    text += `Pitch: ${s.pitch}\n\nCierre: ${s.cierre}`
    addSection('Script de Llamada', text)
  }

  // Objeciones
  if (data.objeciones) {
    const text = data.objeciones.map(o =>
      `Objeción: "${o.objecion}"\nRespuesta: ${o.respuesta}\nRedirección: ${o.redireccion}`
    ).join('\n\n')
    addSection('Manejo de Objeciones', text)
  }

  // Follow-up
  if (data.followup_secuencia) {
    const text = data.followup_secuencia.map(f =>
      `Día ${f.dia} (${f.canal}): ${f.mensaje}`
    ).join('\n\n')
    addSection('Secuencia de Follow-up', text)
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('prospectly.shop — by MolvicStudios.pro', margin, 290)
    doc.text(`${i} / ${pageCount}`, doc.internal.pageSize.getWidth() - margin - 10, 290)
  }

  doc.save(`prospectly-kit-prospeccion-${Date.now()}.pdf`)
}
