import type { Page } from '@playwright/test'

export async function sanitizeSensitiveData(page: Page): Promise<void> {
  await page.evaluate(() => {
    const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
    const ruc = /(?<!\d)(?:10|15|17|20)\d{9}(?!\d)/g
    const phone = /(?<!\d)(?:\+?51[\s-]?)?9\d{2}[\s-]?\d{3}[\s-]?\d{3}(?!\d)/g
    const dni = /(?<!\d)\d{8}(?!\d)/g
    const sensitiveHeader = /cliente|nombre|contacto|correo|email|tel[eé]fono|celular|whatsapp|dni|ruc|documento|raz[oó]n\s*social|empresa|alumno|proveedor|usuario|asesor|responsable|titular/i
    const personName = /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ']+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ']+){1,3}$/

    const neutralize = (value: string) => value
      .replace(email, 'correo oculto')
      .replace(ruc, 'RUC oculto')
      .replace(phone, 'teléfono oculto')
      .replace(dni, 'DNI oculto')

    const headerMask = (label: string) => {
      if (/correo|email/i.test(label)) return 'correo oculto'
      if (/tel[eé]fono|celular|whatsapp/i.test(label)) return 'teléfono oculto'
      if (/ruc/i.test(label)) return 'RUC oculto'
      if (/dni|documento/i.test(label)) return 'DNI oculto'
      return 'Usuario Demo'
    }

    for (const input of document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')) {
      if (input.value) input.value = neutralize(input.value)
    }

    for (const table of document.querySelectorAll('table')) {
      const headers = [...table.querySelectorAll('thead th')]
      const sensitiveIndexes = headers
        .map((header, index) => sensitiveHeader.test(header.textContent ?? '') ? index : -1)
        .filter(index => index >= 0)
      for (const row of table.querySelectorAll('tbody tr')) {
        const cells = [...row.querySelectorAll('td')]
        for (const [index, cell] of cells.entries()) {
          if (!cell) continue
          const text = (cell.textContent ?? '').trim()
          if (sensitiveIndexes.includes(index)) {
            cell.textContent = headerMask(headers[index]?.textContent ?? '')
            continue
          }
          if (personName.test(text) && !/estado|pendiente|aprobado|rechazado|completado/i.test(text)) {
            cell.textContent = 'Usuario Demo'
          }
        }
      }
    }

    const labeledField = /^(dni|ruc|whatsapp|tel[eé]fono|celular|correo|email|documento)\s*:?\s*$/i
    for (const node of document.querySelectorAll('div, span, dt, th, label, p')) {
      if (node.children.length > 0) continue
      if (!labeledField.test((node.textContent ?? '').trim())) continue
      const value = node.nextElementSibling
      if (value && value.children.length === 0) {
        const label = node.textContent ?? ''
        value.textContent = headerMask(label)
      }
    }

    for (const card of document.querySelectorAll('[data-manual-capture="news-card"]')) {
      for (const node of card.querySelectorAll('span, p, div')) {
        if (node.children.length > 0) continue
        if (/Publicado por/i.test(node.textContent ?? '') || /Publicado por/i.test(node.parentElement?.textContent ?? '')) {
          const owner = /Publicado por/i.test(node.textContent ?? '') ? node : node.parentElement
          if (owner) owner.textContent = 'Publicado por Equipo Probusiness'
        }
      }
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let node: Node | null
    while ((node = walker.nextNode())) {
      const parent = node.parentElement
      if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) continue
      const value = node.textContent ?? ''
      const context = parent.closest('span, p, div, td, li')?.textContent ?? parent.textContent ?? ''
      if (/Publicado por/i.test(context)) {
        if (/Publicado por/i.test(value)) {
          node.textContent = value.replace(/(Publicado por\s+).+/i, '$1Equipo Probusiness')
        } else if (personName.test(value.trim())) {
          node.textContent = 'Equipo Probusiness'
        }
        continue
      }
      node.textContent = neutralize(value)
    }
  })
}
