import type { ChinaContainer, ChinaContainerData, ChinaContainerGroup } from '~/types/china-caja'

export type ChinaColor = 'error' | 'primary' | 'neutral' | 'info' | 'success' | 'warning'

/** Montos: sin +/− y con centavos. */
export const AMOUNT_UI = { increment: 'hidden', decrement: 'hidden', base: 'px-3 text-left' } as const

export const CHINA_FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp'

export const CHINA_FILTER_ALL = 'todos'

/** Estados del contenedor. Deben coincidir con ChinaContainerRules (backend) y van en orden de urgencia. */
export const CHINA_CONTAINER_GROUP: Record<ChinaContainerGroup, { label: string; color: ChinaColor }> = {
  arrived: { label: 'Arribó con pendientes', color: 'error' },
  this_week: { label: 'Llega esta semana', color: 'primary' },
  no_date: { label: 'Sin fecha de arribo', color: 'neutral' },
  in_transit: { label: 'En tránsito', color: 'neutral' },
  to_sail: { label: 'Por embarcar', color: 'info' },
  completed: { label: 'Completado', color: 'success' }
}

export const CHINA_COLLECTION: Record<ChinaContainer['collection'], { label: string; color: ChinaColor }> = {
  none: { label: 'Sin cobro', color: 'neutral' },
  pending: { label: 'Por cobrar', color: 'error' },
  partial: { label: 'Parcial', color: 'warning' },
  paid: { label: 'Pagado', color: 'success' }
}

export const CHINA_CONTAINER_TAB = { OPEN: 'abiertos', COMPLETED: 'completados' } as const

export const CHINA_CONTAINER_PENDING: Record<string, { label: string; match: (row: ChinaContainer) => boolean }> = {
  bl: { label: 'Sin BL oficial', match: (row) => !row.data.bl_official_name },
  telex: { label: 'Sin telex', match: (row) => !row.data.telex },
  cobro: { label: 'Cobro pendiente', match: (row) => row.collection !== 'paid' },
  flete: { label: 'Flete por pagar', match: (row) => !row.freight.paid && !!row.data.freight_usd }
}

export interface ChinaContainerField { key: keyof ChinaContainerData; label: string; type: 'text' | 'date' | 'amount' | 'list' }

/** Panel lateral de Estado de contenedores (cliente, servicio y país no se editan). */
export const CHINA_CONTAINER_FIELDS: ChinaContainerField[] = [
  { key: 'bl_number', label: 'Cód. BL', type: 'text' },
  { key: 'bl_consignee', label: 'Consignatario (CNE)', type: 'text' },
  { key: 'shipper', label: 'Cód. shipper', type: 'text' },
  { key: 'shipping_line', label: 'Naviera', type: 'text' },
  { key: 'container_type', label: 'T. contenedor', type: 'list' },
  { key: 'free_days', label: 'Free days', type: 'text' },
  { key: 'sailing_on', label: 'Zarpe', type: 'date' },
  { key: 'arrival_on', label: 'Arribo', type: 'date' },
  { key: 'freight_usd', label: 'Flete (USD)', type: 'amount' }
]

export const CHINA_CASH_TAB = { FLOW: 'flujo', HISTORY: 'cierres' } as const

export const CHINA_CASH_PERIOD_MONTH = 'mes'

export const CHINA_CASH_ORIGINS: string[] = ['Todos', 'Operación', 'Pago proveedor', 'Flete', 'Costo fijo', 'Inversión']

export const CHINA_CASH_GRAINS: Array<{ label: string; value: number }> = [{ label: 'Mensual', value: 1 }, { label: 'Trimestral', value: 3 }, { label: 'Semestral', value: 6 }]

export const CHINA_PENDING_URGENT = 'urgentes'

export const CHINA_PENDING_SECTIONS = ['Seguimiento', 'Carga consolidada', 'Flujo de caja', 'Operaciones', 'Pago proveedores', 'Contenedores'] as const

export const MODAL_UI = { content: 'w-full max-w-lg sm:max-w-lg', header: 'border-t-[5px] border-t-primary-500', title: 'text-lg font-bold text-highlighted' } as const
