import type { ExcelConfirmacionItem } from '~/services/cargaconsolidada/clientes/excelConfirmacionCoordinacionService'

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
  excel_conf_form_cerrado: boolean
  items: IntranetItemFormState[]
}

const normalizeLabel = (label: string) => label.trim().toLowerCase()

const isCampoFijo = (label: string) =>
  CAMPOS_FIJOS.some((campo) => normalizeLabel(campo) === normalizeLabel(label))

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
  const caracteristicas = Object.fromEntries(
    tipoLabels.map((label) => [label, String(raw[label] ?? '')])
  )

  return {
    id: item.id,
    initial_name: item.initial_name || '',
    tipo_producto: item.tipo_producto || 'GENERAL',
    caracteristicas,
    qty: item.qty ?? item.initial_qty ?? null,
    precio_unitario: item.precio_unitario ?? item.initial_price ?? null,
    nombre_comercial: String(raw[CAMPO_NOMBRE_COMERCIAL] ?? item.initial_name ?? ''),
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
