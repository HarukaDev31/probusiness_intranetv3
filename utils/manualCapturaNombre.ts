export function stripFotoPrefix(value?: string | null): string {
  const text = String(value || '').trim()
  if (!text) return ''
  return text.replace(/^Foto\s+\d+\s*[—–-]\s*/u, '').trim()
}

export function stripPasosPrefix(value?: string | null): string {
  const text = String(value || '').trim()
  if (!text) return ''
  return text.replace(/^Pasos\s*[—–-]?\s*/u, '').trim()
}

export function nombreCapturaDesdeSnapshot(
  snapshot?: Record<string, unknown> | null,
  blockTitulo?: string | null,
  pageTitulo?: string | null,
): string {
  const snap = snapshot || {}
  const stored = String(snap.nombre || '').trim()
  if (stored) return stored

  const flow = stripPasosPrefix(String(snap.capture_flow || ''))
  const stepRaw = snap.capture_step && typeof snap.capture_step === 'object'
    ? (snap.capture_step as { title?: string }).title
    : ''
  const step = stripFotoPrefix(String(stepRaw || ''))
  if (flow && step && flow.toLowerCase() !== step.toLowerCase()) {
    return `${flow} — ${step}`
  }
  if (flow) return flow
  if (step) return step

  const titulo = stripFotoPrefix(blockTitulo)
  const page = String(pageTitulo || '').trim()
  if (titulo && page && page.toLowerCase() !== titulo.toLowerCase()) {
    return `${page} — ${titulo}`
  }
  if (titulo) return titulo
  if (page) return page
  return 'Imagen del manual'
}
