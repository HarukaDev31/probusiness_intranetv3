export const INBOX_TAB = {
  PENDING: 'pending',
  ALL: 'all',
} as const

export const SUPPLIER_PAYMENT_PROFILE = {
  SALES: 'sales',
  ADMINISTRATION: 'administration',
  WAREHOUSE: 'warehouse',
} as const

export const SALES_TASK = {
  ALL: 'all',
  PROVIDER_DATA: 'provider_data',
  RECEIPT: 'receipt',
  OBSERVED: 'observed',
  CONFIRMATION: 'confirmation',
  INSTALLMENT_2: 'installment_2',
} as const

export const INSTALLMENT_CHOICE = {
  PROCEED: 'se_realizara',
  CANCEL: 'no_se_realizara',
} as const

export const REQUEST_OWNER = {
  SALES: 'sales',
  OTHER: 'other',
} as const

export const SUPPLIER_CURRENCY = {
  USD: 'USD',
  RMB: 'RMB',
} as const

export const PAYMENT_SHAPE = {
  SINGLE: 'single',
  CLIENT_INSTALLMENTS: 'client_installments',
  SUPPLIER_INSTALLMENTS: 'supplier_installments',
} as const

export const REQUEST_STAGE = {
  DATA: 1,
  VALIDATION: 2,
  EXECUTION: 3,
  CONFIRMATION: 4,
} as const

export const VERIFICATION_TAB = 'supplier-payment'

export const DEPOSIT_STATUS = {
  PENDING: 'en_validacion',
  VALIDATED: 'validado',
  OBSERVED: 'observado',
  CANCELLED: 'anulado',
  ALL: 'all',
} as const

export const DEPOSIT_BANK = {
  BCP: 'bcp',
  INTERBANK: 'interbank',
  ALL: 'all',
} as const

export const APPROVAL_BUCKET = {
  PENDING: 'pending',
  APPROVED: 'approved',
} as const

export const EXECUTION_BUCKET = {
  PENDING: 'pending',
  PAID: 'paid',
} as const

export const YUAN_BUCKET = {
  OPEN: 'open',
  COMPLETED: 'completed',
} as const

export const EXCHANGE_RESULT = {
  WITHIN: 'within_tolerance',
  COLLECT: 'to_collect',
  REFUND: 'to_refund',
} as const

export const PAYMENT_CHOICE = {
  PROCEED: 'se_realizara',
  CANCEL: 'anulado',
  REFUND: 'reembolso_solicitado',
} as const

export const YUAN_STATUS = {
  PENDING: 'pendiente',
  OBSERVED: 'observado',
  PAID: 'pagado',
} as const

export const EXECUTION_STATUS = {
  PENDING: 'pendiente',
  PAID: 'pagado',
} as const

export const APPROVAL_STATUS = {
  PENDING: 'pendiente',
  TO_COLLECT: 'por_cobrar',
  APPROVED: 'aprobado',
  ALL: 'all',
} as const

export const PROVIDER_STATUS = {
  IN_PROGRESS: 'en_proceso',
  OBSERVED: 'observado',
  CANCELLED: 'anulado',
  COMPLETED: 'completado',
} as const

export type SupplierPaymentProfile = typeof SUPPLIER_PAYMENT_PROFILE[keyof typeof SUPPLIER_PAYMENT_PROFILE]
export type SalesTask = typeof SALES_TASK[keyof typeof SALES_TASK]

export const REFUND_STATUS = {
  CONSULT: 'por_consultar',
  REQUESTED: 'solicitado',
  APPROVED: 'aprobado',
  REJECTED: 'rechazado',
} as const

export const SURPLUS_DECISION = {
  CONSULT: 'por_consultar',
  REFUND: 'reembolso_solicitado',
  APPLY: 'aplicado_cuota',
  KEEP: 'no_devuelve',
} as const
