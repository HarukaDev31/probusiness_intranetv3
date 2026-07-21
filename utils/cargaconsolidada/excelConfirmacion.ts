import type { ExcelConfirmacionItem } from '~/services/cargaconsolidada/clientes/excelConfirmacionCoordinacionService'
import { unitKeysForLabels } from '~/utils/cargaconsolidada/caracteristicaFields'

export type LabelsPorTipoProducto = Record<string, string[]>

export const CAMPO_NOMBRE_COMERCIAL = 'NOMBRE COMERCIAL'
export const CAMPO_FOTO = 'FOTO/IMAGEN'
export const CAMPO_HS_CODE = 'HS CODE (Solicitar al Proveedor)'
export const CAMPO_LINK = 'LINK DEL PRODUCTO'

export const CAMPOS_FIJOS = [
  CAMPO_NOMBRE_COMERCIAL,
  CAMPO_FOTO,
  CAMPO_HS_CODE,
  CAMPO_LINK
] as const

export interface IntranetItemFormState {
  id: number
  initial_name: string
  tipo_producto: string
  caracteristicas: Record<string, string>
  qty: number | null
  precio_unitario: number | null
  nombre_comercial: string
  foto_url: string
  hs_code: string
  link_producto: string
  isNew: boolean
}

export interface IntranetProveedorFormState {
  id: number
  code_supplier: string
  excel_conf_status?: string | null
  excel_conf_status_final?: string | null
  excel_conf_form_cerrado: boolean
  items: IntranetItemFormState[]
}

const normalizeLabel = (label: string) => label.trim().toLowerCase()

const isCampoFijo = (label: string) =>
  CAMPOS_FIJOS.some((campo) => normalizeLabel(campo) === normalizeLabel(label))

const LEGACY_CARACTERISTICA_ALIASES: Record<string, string[]> = {
  'Tamaño (Producto):': ['Tamaño:', 'Tamaño del producto:', 'Tamaño (Metros):'],
  'Capacidad:': ['Capacidad (ml o kg):'],
  'Peso Neto (Producto):': ['Peso Neto:', 'Peso'],
  'Unidad de medida:': ['Pares o Piezas:']
}

const resolveFromRaw = (raw: Record<string, string>, label: string): string => {
  const direct = String(raw[label] ?? '').trim()
  if (direct) return direct
  for (const alias of LEGACY_CARACTERISTICA_ALIASES[label] || []) {
    const value = String(raw[alias] ?? '').trim()
    if (value) return value
  }
  return String(raw[label] ?? '')
}

export const labelsForTipo = (labels: LabelsPorTipoProducto, tipo: string): string[] => {
  const key = (tipo || 'GENERAL').toUpperCase()
  const tipoLabels = labels[key] || labels.GENERAL || []
  return tipoLabels.filter((label) => !isCampoFijo(label))
}

export const apiItemToFormState = (
  item: ExcelConfirmacionItem,
  labels: LabelsPorTipoProducto
): IntranetItemFormState => {
  const raw = { ...(item.caracteristicas || {}) }
  const tipoLabels = labelsForTipo(labels, item.tipo_producto)
  const unitKeys = unitKeysForLabels(tipoLabels)
  const caracteristicas = Object.fromEntries([
    ...tipoLabels.map((label) => [label, resolveFromRaw(raw, label)]),
    ...unitKeys.map((key) => [key, String(raw[key] ?? '')])
  ])

  if (
    String(raw['Tamaño (Metros):'] ?? '').trim() !== '' &&
    !String(caracteristicas['Unidad Tamaño:'] ?? '').trim()
  ) {
    caracteristicas['Unidad Tamaño:'] = 'metros'
  }

  return {
    id: item.id,
    initial_name: item.initial_name || '',
    tipo_producto: item.tipo_producto || 'GENERAL',
    caracteristicas,
    qty: item.qty ?? null,
    precio_unitario: item.precio_unitario ?? null,
    nombre_comercial: String(raw[CAMPO_NOMBRE_COMERCIAL] ?? ''),
    foto_url: String(raw[CAMPO_FOTO] ?? ''),
    hs_code: String(raw[CAMPO_HS_CODE] ?? ''),
    link_producto: String(raw[CAMPO_LINK] ?? ''),
    isNew: Boolean(item.is_new)
  }
}

export const formStateToSaveItem = (item: IntranetItemFormState) => ({
  id: item.id,
  is_new: item.isNew,
  tipo_producto: item.tipo_producto,
  caracteristicas: {
    ...item.caracteristicas,
    [CAMPO_NOMBRE_COMERCIAL]: item.nombre_comercial,
    [CAMPO_FOTO]: item.foto_url,
    [CAMPO_HS_CODE]: item.hs_code,
    [CAMPO_LINK]: item.link_producto
  },
  qty: item.qty,
  precio_unitario: item.precio_unitario
})

export const calcItemTotal = (item: Pick<IntranetItemFormState, 'qty' | 'precio_unitario'>) =>
  (Number(item.qty) || 0) * (Number(item.precio_unitario) || 0)

export const formatUsd = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const sanitizeMoneyDraft = (raw: string | number | null | undefined): string => {
  let cleaned = String(raw ?? '').replace(/[^0-9.]/g, '')
  const firstDot = cleaned.indexOf('.')
  if (firstDot === -1) return cleaned

  cleaned =
    cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
  const [intPart, decPart = ''] = cleaned.split('.')
  return `${intPart}.${decPart.slice(0, 2)}`
}

/** Formatea con miles mientras se escribe (ej. 1234.5 → 1,234.5). */
export const formatMoneyWhileTyping = (raw: string | number | null | undefined): string => {
  const cleaned = sanitizeMoneyDraft(raw)
  if (!cleaned) return ''
  if (cleaned === '.') return '0.'

  const [intRaw, decRaw] = cleaned.split('.')
  const intNum = Number(intRaw || '0')
  if (!Number.isFinite(intNum)) return ''

  const intFormatted = intNum.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (decRaw !== undefined) return `${intFormatted}.${decRaw}`
  return intFormatted
}

export const parseMoneyDraft = (raw: string | number | null | undefined): number | null => {
  const cleaned = sanitizeMoneyDraft(raw)
  if (!cleaned || cleaned === '.') return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

export const roundMoney = (value: number): number => Math.round(value * 100) / 100
