/** 0 = Provincia, 1 = Lima (convención API entregas). */
export type TypeFormEntrega = 0 | 1

export function normalizeTypeFormEntrega(raw: unknown): TypeFormEntrega | null {
  if (raw === 1 || raw === '1' || raw === true) return 1
  if (raw === 0 || raw === '0' || raw === false) return 0
  if (typeof raw === 'string') {
    const t = raw.trim().toUpperCase()
    if (t === 'LIMA' || t.includes('LIMA')) return 1
    if (t === 'PROVINCIA' || t === 'PROVINCE' || t.includes('PROVIN')) return 0
  }
  return null
}

function rowHasProvinciaForm(row: Record<string, unknown> | null | undefined): boolean {
  if (!row) return false
  const markers = [
    row.department_name,
    row.agency_ruc,
    row.agency_name,
    row.r_doc,
    row.r_name,
    row.id_department,
    row.id_province,
    row.province_id
  ]
  return markers.some((v) => v !== null && v !== undefined && String(v).trim() !== '')
}

function rowHasLimaForm(row: Record<string, unknown> | null | undefined): boolean {
  if (!row) return false
  const markers = [row.pick_doc, row.pick_name, row.drver_name, row.driver_plate]
  return markers.some((v) => v !== null && v !== undefined && String(v).trim() !== '')
}

/**
 * Resuelve tipo de entrega: prioriza datos del formulario L/P en la fila
 * (cuando el listado los expone) y luego type_form / tipo_entrega del API.
 */
export function resolveTypeFormEntrega(row: Record<string, unknown> | null | undefined): TypeFormEntrega | null {
  if (rowHasProvinciaForm(row)) return 0
  if (rowHasLimaForm(row)) return 1
  return normalizeTypeFormEntrega(row?.type_form ?? row?.tipo_entrega)
}

export function isEntregaLima(typeForm: TypeFormEntrega | null): boolean {
  return typeForm === 1
}

export function tipoEntregaLabel(typeForm: TypeFormEntrega | null): string {
  if (typeForm === 0) return 'Provincia'
  if (typeForm === 1) return 'Lima'
  return '-'
}

export function tipoEntregaBadgeColor(label: string): 'success' | 'warning' | 'primary' | 'neutral' {
  if (label === 'Lima') return 'success'
  if (label === 'Provincia') return 'primary'
  return 'neutral'
}
