/** Normaliza fecha máxima de pago a YYYY-MM-DD. */
export function toIsoFechaMaximaPago(raw: unknown): string | null {
  if (raw == null || raw === '') return null
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    return toIsoFechaMaximaPago(obj.value ?? obj.date ?? obj.fecha_maxima_pago)
  }

  const text = String(raw).trim()
  if (!text || text.startsWith('0000-00-00') || text === 'Sin definir') return null

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text)
  if (iso) {
    const year = Number(iso[1])
    if (year < 1971) return null
    return `${iso[1]}-${iso[2]}-${iso[3]}`
  }

  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text)
  if (dmy) {
    const year = Number(dmy[3])
    if (year < 1971) return null
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  }

  return null
}

function headerItems(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') return Object.values(data)
  return []
}

/** Lee fecha_maxima_pago de respuestas de headers/pagos/general. */
export function pickFechaMaximaPago(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const p = payload as Record<string, unknown>
  const nestedData = p.data && typeof p.data === 'object' && !Array.isArray(p.data)
    ? (p.data as Record<string, unknown>)
    : null

  const candidates = [
    p.fecha_maxima_pago,
    nestedData?.fecha_maxima_pago,
  ]

  for (const candidate of candidates) {
    const iso = toIsoFechaMaximaPago(candidate)
    if (iso) return iso
  }

  for (const item of headerItems(p.data)) {
    if (!item || typeof item !== 'object') continue
    const header = item as Record<string, unknown>
    const key = String(header.key ?? '')
    const label = String(header.label ?? '').toLowerCase()
    if (key !== 'fecha_maxima_pago' && !label.includes('fecha máx') && !label.includes('fecha max')) {
      continue
    }
    const iso = toIsoFechaMaximaPago(header.value)
    if (iso) return iso
  }

  return null
}
