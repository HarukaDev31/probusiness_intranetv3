export const ESTADOS_PAGO = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'ADELANTO', label: 'Adelanto' },
  { value: 'PAGADO', label: 'Pagado' },
  { value: 'SOBREPAGO', label: 'Sobrepago' }
]

export const CARGAS_DISPONIBLES = [
  { value: 'todos', label: 'Todas las cargas' },
  { value: 'C-001', label: 'Carga C-001' },
  { value: 'C-002', label: 'Carga C-002' },
  { value: 'C-003', label: 'Carga C-003' }
]

export const CONCEPTOS_PAGO = [
  'LOGISTICA',
  'IMPUESTOS',
  'ADUANAS',
  'TRANSPORTE',
  'ALMACENAJE'
] as const

export const STATUS_PAGO = [
  'PENDIENTE',
  'CONFIRMADO',
  'RECHAZADO',
  'EN_PROCESO'
] as const 