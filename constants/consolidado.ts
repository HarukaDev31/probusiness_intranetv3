export const ESTADOS_PAGO = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'ADELANTO', label: 'Adelanto' },
  { value: 'PAGADO', label: 'Pagado' },
  { value: 'SOBREPAGO', label: 'Sobrepago' }
]

export const CARGAS_DISPONIBLES = [
  { value: 'todos', label: 'Todas las cargas' },

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