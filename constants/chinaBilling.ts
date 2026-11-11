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

/** Colores de la píldora de estado (fondo y texto), como en la maqueta. */
export const CHINA_STATUS_PILL: Record<string, string> = {
  [CHINA_STATUS.DRAFT]: 'bg-[#fef6e0] text-[#8a5a00]',
  [CHINA_STATUS.PENDING]: 'bg-[#eef1f6] text-[#4a5a72]',
  [CHINA_STATUS.TO_CONFIRM]: 'bg-[#fff3ea] text-[#b4480c]',
  [CHINA_STATUS.CONFIRMED]: 'bg-[#e7f0fd] text-[#1d4f91]',
  [CHINA_STATUS.IN_CASH]: 'bg-[#e8f6ee] text-[#1f7a45]'
}

/** Punto de color de la barra de estados. */
export const CHINA_STATUS_DOT: Record<string, string> = {
  [CHINA_STATUS.ALL]: 'bg-[#1e2a3b]',
  [CHINA_STATUS.DRAFT]: 'bg-[#8a5a00]',
  [CHINA_STATUS.PENDING]: 'bg-[#4a5a72]',
  [CHINA_STATUS.TO_CONFIRM]: 'bg-[#b4480c]',
  [CHINA_STATUS.CONFIRMED]: 'bg-[#1d4f91]',
  [CHINA_STATUS.IN_CASH]: 'bg-[#1f7a45]'
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

/** Colores de la píldora de estado del socio, como en la maqueta. */
export const PARTNER_STATUS_PILL: Record<string, string> = {
  pending: 'bg-[#fff3ea] text-[#b4480c]',
  partial: 'bg-[#fef6e0] text-[#8a5a00]',
  to_confirm: 'bg-[#e7f0fd] text-[#1d4f91]',
  paid: 'bg-[#e8f6ee] text-[#1f7a45]'
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
