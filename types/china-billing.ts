export interface ChinaOrganizationRef {
  id: number
  name: string
  country: string
}

export interface ChinaOperationCost {
  id?: number
  name: string
  amount: number
  source_operation_id?: number | null
}

export interface ChinaOperationPaymentRef {
  payment_id: number
  code: string
  amount: number
  status: string
}

export interface ChinaCreditApplication {
  id: number
  amount: number
  from_operation_id: number | null
}

/** Operación aprobada o borrador "Por aprobar" (is_draft). Todos los montos los calcula el backend. */
export interface ChinaOperation {
  id: number | null
  is_draft: boolean
  code: string | null
  organization: ChinaOrganizationRef
  issued_on: string
  description: string
  service_name: string
  billing_type: string
  variant_name?: string | null
  container_id: number | null
  cbm: number | null
  rate?: number | null
  amount?: number
  fob?: number
  freight?: number
  packing_list_url?: string | null
  costs?: ChinaOperationCost[]
  transferred_to_operation_id?: number | null
  transferred_to_code?: string | null
  payments?: ChinaOperationPaymentRef[]
  credits?: ChinaCreditApplication[]
  status: string
  partner_status?: string
  service_amount?: number
  extras_amount?: number
  total: number
  declared?: number
  confirmed?: number
  in_confirmation?: number
  received?: number
  received_rmb?: number
  credit_applied?: number
  shortfall_included?: number
  pending?: number
  balance_due?: number
  difference?: number | null
  transferred?: boolean
}

export interface ChinaPaymentAllocation {
  operation_id: number
  code: string
  label?: string
  amount: number
  /** Lo que realmente cuenta para la operación (el faltante se descuenta de la elegida). */
  real_amount?: number
}

export interface ChinaPayment {
  id: number
  code: string
  organization: ChinaOrganizationRef
  paid_on: string
  status: string
  registered_by: string
  amount_sent: number
  amount_received: number | null
  allocated: number
  unassigned?: number
  shortfall: number
  credit_generated: number
  credit_used: number
  shortfall_operation_id: number | null
  exchange_rate: number | null
  yuan_amount: number | null
  receipt_url: string | null
  receipt_name: string | null
  cash_voucher_url: string | null
  cash_voucher_name: string | null
  confirmed_at: string | null
  cashed_at: string | null
  allocations: ChinaPaymentAllocation[]
}

export interface ChinaSummary {
  operations_count: number
  services_amount: number
  receivable: number
  income_usd: number
  income_rmb: number
  total_billed: number
  paid: number
  in_confirmation: number
  balance_due: number
  credit_balance: number
}

export interface ChinaCredit {
  organization_id: number
  name: string
  balance: number
}

export interface ChinaOrganizationOption {
  id: number
  name: string
  country: string
  country_id: number | null
  /** Tarifas del socio (USD por CBM) para precargar la operación. */
  prices?: { consol?: number | null; consol_2?: number | null } | null
}

export interface ChinaPagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type ChinaCounts = Record<string, number>

export interface ChinaOperationFormPayload {
  organization_id: number
  container_id: number | null
  service_name: string
  billing_type: string
  variant_name: string
  issued_on: string
  description: string
  cbm: number | null
  rate: number | null
  amount: number | null
  fob: number | null
  freight: number | null
  costs: ChinaOperationCost[]
  packing_list: File | null
}

export interface ChinaPaymentFormPayload {
  organization_id?: number
  paid_on: string
  amount_sent: number
  allocations: { operation_id: number; amount: number }[]
  receipt: File | null
}

export interface ChinaBankAccount {
  company: string
  company_address: string
  beneficiary: string
  beneficiary_address: string
  beneficiary_country: string
  beneficiary_state: string
  beneficiary_city: string
  account_number: string
  intermediary_bank: string
  intermediary_swift: string
  intermediary_country: string
  intermediary_state: string
  intermediary_city: string
  payer_bank: string
  payer_swift: string
  payer_country: string
  payer_state: string
  payer_city: string
}

/** Factura o balance ya emitido (PDF generado por el backend). */
export interface ChinaDocument {
  id: number
  type: string
  issued_on: string
  created_at: string | null
  file_name: string
  url: string
  generated_by: string | null
  total: number | null
}

/** Qué documento se quiere ver o emitir. */
export interface ChinaDocumentTarget {
  kind: 'invoice' | 'balance'
  mode: 'china' | 'partner'
  title: string
  operationId?: number
  organizationId?: number
}

export interface ChinaListFilters {
  status?: string
  search?: string
  country_id?: number | string
  organization_id?: number | string
  from?: string
  to?: string
  page?: number
  per_page?: number
}

export type ChinaClientType = 'partner' | 'importer'

export interface ChinaClientPrices {
  consol: number | null
  consol_2: number | null
}

export interface ChinaClientService {
  code: string | null
  issued_on: string | null
  service_name: string
  description: string
  total: number | null
  received: number | null
  balance: number | null
  status: string
}

/** Cliente de Almacén China (socio u importador). Los totales los calcula el backend. */
export interface ChinaClient {
  id: number
  number?: number
  type: ChinaClientType
  organization_id: number | null
  name: string
  country: string
  registered_on: string | null
  whatsapp: string
  contact_name: string
  email: string
  prices: ChinaClientPrices | null
  operations_count: number
  service_amount: number
  total_billed: number
  paid: number
  receivable: number
  open_count: number
  closed_count: number
  can_delete: boolean
  can_download_balance: boolean
  services?: ChinaClientService[]
}

export interface ChinaClientPayload {
  type?: ChinaClientType
  organization_id?: number | null
  /** País de la organización nueva (solo al crear un socio). */
  country_id?: number | null
  name: string
  country: string
  whatsapp: string
  contact_name: string
  email: string
  prices: { consol: number | null; consol_2: number | null } | null
}

/** Pestaña por organización: cuántos clientes registró. */
export interface ChinaClientGroup {
  organization_id: number
  name: string
  country: string
  count: number
}

export interface ChinaCountryOption {
  value: number
  label: string
}

/** Cliente que registró una organización (solo lectura). */
export interface ChinaOrganizationClient {
  id: number
  number: number
  registered_on: string | null
  name: string
  document: string
  phone: string
  email: string
  province: string
  origin: string
  service: string
  category: string
}
