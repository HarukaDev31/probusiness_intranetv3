import type { ChinaContainer, ChinaContainerData, ChinaContainerGroup } from '~/types/china-caja'

/** Montos: sin +/− y con centavos. */
export const AMOUNT_UI = { increment: 'hidden', decrement: 'hidden', base: 'px-3 text-left' } as const

export const CHINA_FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp'

/** BL draft: solo el Excel de la naviera; el backend toma el N. BL de la celda «B/L. NO.». */
export const CHINA_BL_DRAFT_ACCEPT = '.xlsx,.xls'

export const CHINA_FILTER_ALL = 'todos'

export const CHINA_ALL_ORIGINS = 'Todos'

export const CHINA_ORIGIN_TONE: Record<string, string> = {
  'Operación': 'cc-c-blue', 'Pago proveedor': 'cc-c-violet', 'Flete': 'cc-c-flete', 'Costo fijo': 'cc-c-gray', 'Inversión': 'cc-c-amber'
}

export const CHINA_ORIGIN_GO: Record<string, string> = {
  'Operación': 'Ir a operación', 'Pago proveedor': 'Ir a pago proveedor', 'Flete': 'Ir a contenedor', 'Costo fijo': 'Ver costos fijos', 'Inversión': 'Ver inversiones'
}

export const CHINA_SECTION_TONE: Record<string, string> = {
  'Seguimiento': 'cc-c-green', 'Carga consolidada': 'cc-c-olive', 'Flujo de caja': 'cc-c-gray', 'Operaciones': 'cc-c-blue', 'Pago proveedores': 'cc-c-violet', 'Contenedores': 'cc-c-flete'
}

/** Estados del contenedor. Deben coincidir con ChinaContainerRules (backend) y van en orden de urgencia. */
export const CHINA_CONTAINER_GROUP: Record<ChinaContainerGroup, { label: string; color: string }> = {
  arrived: { label: 'Arribó con pendientes', color: '#d93025' },
  this_week: { label: 'Llega esta semana', color: '#f26b1d' },
  no_date: { label: 'Sin fecha de arribo', color: '#c5cdd9' },
  in_transit: { label: 'En tránsito', color: '#9aa6b8' },
  to_sail: { label: 'Por embarcar', color: '#2f6fd8' },
  completed: { label: 'Completados', color: '#1f9d55' }
}

export const CHINA_COLLECTION: Record<ChinaContainer['collection'], { label: string; tone: string }> = {
  none: { label: 'Sin cobro', tone: 'bg-(--cc-empty) text-(--cc-muted)' },
  pending: { label: 'Por cobrar', tone: 'cc-c-red' },
  partial: { label: 'Parcial', tone: 'cc-c-amber' },
  paid: { label: 'Pagado', tone: 'cc-c-green' }
}

export const CHINA_CONTAINER_TAB = { OPEN: 'abiertos', COMPLETED: 'completados' } as const

export const CHINA_CONTAINER_CHIPS: Array<{ key: string; label: string; match: (row: ChinaContainer) => boolean }> = [
  { key: '', label: 'Todos', match: () => true },
  { key: 'bl', label: 'sin BL oficial', match: (row) => !row.data.bl_official_name },
  { key: 'telex', label: 'sin Telex', match: (row) => !row.data.telex },
  { key: 'cobro', label: 'cobro pendiente', match: (row) => row.collection !== 'paid' },
  { key: 'flete', label: 'flete por pagar', match: (row) => !row.freight.paid && !!row.data.freight_usd }
]

export interface ChinaContainerField { key: keyof ChinaContainerData; label: string; type: 'text' | 'date' | 'amount'; placeholder?: string; wide?: boolean }

/** Panel lateral de Estado de contenedores (cliente, servicio y país no se editan). */
export const CHINA_CONTAINER_FIELDS: ChinaContainerField[] = [
  { key: 'bl_number', label: 'COD. BL', type: 'text', placeholder: 'Pendiente' },
  { key: 'bl_consignee', label: 'CONSIGNATARIO (CNE)', type: 'text', wide: true },
  { key: 'shipper', label: 'COD. SHIPPER', type: 'text', placeholder: 'SHI-XUA' },
  { key: 'shipping_line', label: 'NAVIERA', type: 'text' },
  { key: 'container_type', label: 'T. CONTENEDOR', type: 'text', placeholder: '40 HQ' },
  { key: 'free_days', label: 'FREE BOX', type: 'text', placeholder: '14 días libres' },
  { key: 'sailing_on', label: 'ZARPE', type: 'date' },
  { key: 'arrival_on', label: 'ARRIBO', type: 'date' },
  { key: 'freight_usd', label: 'FLETE (USD)', type: 'amount', placeholder: '0.00' }
]

export const CHINA_CASH_TAB = { FLOW: 'flujo', HISTORY: 'cierres' } as const

export const CHINA_CASH_PERIOD_MONTH = 'mes'

export const CHINA_CURRENCY = { RMB: 'RMB', USD: 'USD' } as const

export const CHINA_CASH_ORIGINS: string[] = [CHINA_ALL_ORIGINS, 'Operación', 'Pago proveedor', 'Flete', 'Costo fijo', 'Inversión']

export const CHINA_CASH_GRAINS: Array<{ label: string; value: number }> = [{ label: 'Mensual', value: 1 }, { label: 'Trimestral', value: 3 }, { label: 'Semestral', value: 6 }]

export const CHINA_PENDING_URGENT = 'urgentes'

export const CHINA_PENDING_SECTIONS = ['Seguimiento', 'Carga consolidada', 'Flujo de caja', 'Operaciones', 'Pago proveedores', 'Contenedores'] as const

export const CHINA_STAGE_SHORT: Record<number, string> = { 1: '1 · Reserva contenedor', 2: '2 · Antes del llenado', 3: '3 · Después del llenado' }

export const CHINA_STAGE_SEGMENT: Record<number, string> = { 1: 'Reserva', 2: 'Antes del llenado', 3: 'Después del llenado' }

export const CHINA_STAGE_CBM = 60
