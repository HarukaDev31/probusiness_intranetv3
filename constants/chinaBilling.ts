/** Estados de operaciones y cobros de China. Deben coincidir con ChinaBillingCalculator (backend). */
export const CHINA_STATUS = {
  ALL: 'all',
  DRAFT: 'draft',
  PENDING: 'pending',
  TO_CONFIRM: 'to_confirm',
  CONFIRMED: 'confirmed',
  IN_CASH: 'in_cash'
} as const

export const CHINA_STATUS_LABEL: Record<string, string> = {
  [CHINA_STATUS.DRAFT]: 'Por aprobar',
  [CHINA_STATUS.PENDING]: 'Pendiente',
  [CHINA_STATUS.TO_CONFIRM]: 'Por confirmar',
  [CHINA_STATUS.CONFIRMED]: 'Confirmado',
  [CHINA_STATUS.IN_CASH]: 'En caja'
}

export const CHINA_STATUS_COLOR: Record<string, 'warning' | 'neutral' | 'primary' | 'info' | 'success'> = {
  [CHINA_STATUS.DRAFT]: 'warning',
  [CHINA_STATUS.PENDING]: 'neutral',
  [CHINA_STATUS.TO_CONFIRM]: 'primary',
  [CHINA_STATUS.CONFIRMED]: 'info',
  [CHINA_STATUS.IN_CASH]: 'success'
}

export const CHINA_STATUS_DOT: Record<string, string> = {
  [CHINA_STATUS.ALL]: 'bg-inverted',
  [CHINA_STATUS.DRAFT]: 'bg-warning',
  [CHINA_STATUS.PENDING]: 'bg-neutral',
  [CHINA_STATUS.TO_CONFIRM]: 'bg-primary',
  [CHINA_STATUS.CONFIRMED]: 'bg-info',
  [CHINA_STATUS.IN_CASH]: 'bg-success'
}

export const CHINA_BILLING_TAB = {
  OPERATIONS: 'operations',
  PAYMENTS: 'payments'
} as const

export const CHINA_BILLING_TYPE = {
  FIXED: 'fixed',
  CBM: 'cbm'
} as const

export const CHINA_REGISTERED_BY = {
  PARTNER: 'partner',
  CHINA: 'china'
} as const

/** Estados que ve el socio en sus facturas. */
export const PARTNER_STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  partial: 'Pago parcial',
  to_confirm: 'Por confirmar',
  paid: 'Pagado'
}

export const PARTNER_STATUS_COLOR: Record<string, 'neutral' | 'warning' | 'primary' | 'success'> = {
  pending: 'neutral',
  partial: 'warning',
  to_confirm: 'primary',
  paid: 'success'
}

export const PARTNER_INVOICE_FILTER = {
  ALL: 'all',
  DUE: 'due',
  TO_CONFIRM: 'to_confirm',
  PAID: 'paid'
} as const

export const PARTNER_TAB = {
  INVOICES: 'invoices',
  PAYMENTS: 'payments'
} as const

export const RECEIPT_ACCEPT = '.pdf,.jpg,.jpeg,.png'
