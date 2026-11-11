import { BaseService } from './base/BaseService'
import type {
  ChinaBankAccount,
  ChinaClient,
  ChinaClientPayload,
  ChinaCounts,
  ChinaCredit,
  ChinaDocument,
  ChinaDocumentTarget,
  ChinaListFilters,
  ChinaOperation,
  ChinaOperationFormPayload,
  ChinaOrganizationOption,
  ChinaPagination,
  ChinaPayment,
  ChinaPaymentFormPayload,
  ChinaSummary
} from '~/types/china-billing'

interface Page<T> {
  success: boolean
  data: T[]
  pagination: ChinaPagination
}

interface One<T> {
  success: boolean
  data: T
  warning?: string | null
}

interface Done {
  success: boolean
  message: string
}

function toQuery(params: object): string {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') query.append(key, String(value))
  })
  return query.toString()
}

function operationForm(payload: ChinaOperationFormPayload): FormData {
  const form = new FormData()
  form.append('organization_id', String(payload.organization_id))
  if (payload.container_id) form.append('container_id', String(payload.container_id))
  form.append('service_name', payload.service_name)
  form.append('billing_type', payload.billing_type)
  if (payload.variant_name) form.append('variant_name', payload.variant_name)
  form.append('issued_on', payload.issued_on)
  form.append('description', payload.description)
  ;(['cbm', 'rate', 'amount', 'fob', 'freight'] as const).forEach((key) => {
    if (payload[key] !== null) form.append(key, String(payload[key]))
  })
  payload.costs.forEach((cost, index) => {
    form.append(`costs[${index}][name]`, cost.name)
    form.append(`costs[${index}][amount]`, String(cost.amount))
  })
  if (payload.packing_list) form.append('packing_list', payload.packing_list)
  return form
}

function paymentForm(payload: ChinaPaymentFormPayload): FormData {
  const form = new FormData()
  if (payload.organization_id) form.append('organization_id', String(payload.organization_id))
  form.append('paid_on', payload.paid_on)
  form.append('amount_sent', String(payload.amount_sent))
  payload.allocations.forEach((allocation, index) => {
    form.append(`allocations[${index}][operation_id]`, String(allocation.operation_id))
    form.append(`allocations[${index}][amount]`, String(allocation.amount))
  })
  if (payload.receipt) form.append('receipt', payload.receipt)
  return form
}

export class ChinaBillingService extends BaseService {
  private static baseUrl = '/api/china-billing'

  // --- Almacén China: operaciones ---
  static async listOperations(filters: ChinaListFilters) {
    return this.apiCall<Page<ChinaOperation> & {
      counts: ChinaCounts
      summary: ChinaSummary
      credits: ChinaCredit[]
      organizations: ChinaOrganizationOption[]
    }>(`${this.baseUrl}/operations?${toQuery(filters)}`)
  }

  /** KPIs del encabezado (operaciones y pagos del rango) y saldos a favor. */
  static async summary(filters: { from?: string; to?: string }) {
    return this.apiCall<{ success: boolean; summary: ChinaSummary; credits: ChinaCredit[] }>(`${this.baseUrl}/summary?${toQuery(filters)}`)
  }

  static async createOperation(payload: ChinaOperationFormPayload) {
    return this.apiCall<One<ChinaOperation>>(`${this.baseUrl}/operations`, { method: 'POST', body: operationForm(payload) })
  }

  static async updateOperation(id: number, payload: ChinaOperationFormPayload) {
    return this.apiCall<One<ChinaOperation>>(`${this.baseUrl}/operations/${id}`, { method: 'POST', body: operationForm(payload) })
  }

  static async deleteOperation(id: number) {
    return this.apiCall<Done>(`${this.baseUrl}/operations/${id}`, { method: 'DELETE' })
  }

  static async dismissDraft(containerId: number) {
    return this.apiCall<Done>(`${this.baseUrl}/drafts/${containerId}`, { method: 'DELETE' })
  }

  static async transferDifference(id: number, targetOperationId: number) {
    return this.apiCall<One<ChinaOperation>>(`${this.baseUrl}/operations/${id}/transfer-difference`, {
      method: 'POST',
      body: { target_operation_id: targetOperationId }
    })
  }

  static async undoTransferDifference(id: number) {
    return this.apiCall<One<ChinaOperation>>(`${this.baseUrl}/operations/${id}/undo-transfer-difference`, { method: 'POST' })
  }

  static async applyCredit(id: number, amount: number, fromOperationId?: number | null) {
    return this.apiCall<One<ChinaOperation>>(`${this.baseUrl}/operations/${id}/apply-credit`, {
      method: 'POST',
      body: { amount, from_operation_id: fromOperationId ?? null }
    })
  }

  static async undoCredit(applicationId: number) {
    return this.apiCall<Done>(`${this.baseUrl}/credit-applications/${applicationId}`, { method: 'DELETE' })
  }

  static async pendingOperations(organizationId: number) {
    return this.apiCall<{ success: boolean; data: ChinaOperation[] }>(`${this.baseUrl}/organizations/${organizationId}/pending-operations`)
  }

  // --- Almacén China: cobros ---
  static async listPayments(filters: ChinaListFilters) {
    return this.apiCall<Page<ChinaPayment> & { counts: ChinaCounts }>(`${this.baseUrl}/payments?${toQuery(filters)}`)
  }

  static async getPayment(id: number) {
    return this.apiCall<One<ChinaPayment>>(`${this.baseUrl}/payments/${id}`)
  }

  static async createPayment(payload: ChinaPaymentFormPayload) {
    return this.apiCall<One<ChinaPayment>>(`${this.baseUrl}/payments`, { method: 'POST', body: paymentForm(payload) })
  }

  static async updatePayment(id: number, payload: ChinaPaymentFormPayload) {
    return this.apiCall<One<ChinaPayment>>(`${this.baseUrl}/payments/${id}`, { method: 'POST', body: paymentForm(payload) })
  }

  static async confirmPayment(id: number, amountReceived: number, shortfallOperationId: number | null) {
    return this.apiCall<One<ChinaPayment>>(`${this.baseUrl}/payments/${id}/confirm`, {
      method: 'POST',
      body: { amount_received: amountReceived, shortfall_operation_id: shortfallOperationId }
    })
  }

  static async unconfirmPayment(id: number) {
    return this.apiCall<One<ChinaPayment>>(`${this.baseUrl}/payments/${id}/unconfirm`, { method: 'POST' })
  }

  static async cashPayment(id: number, exchangeRate: number, voucher: File | null) {
    const form = new FormData()
    form.append('exchange_rate', String(exchangeRate))
    if (voucher) form.append('voucher', voucher)
    return this.apiCall<One<ChinaPayment>>(`${this.baseUrl}/payments/${id}/cash`, { method: 'POST', body: form })
  }

  static async uncashPayment(id: number) {
    return this.apiCall<One<ChinaPayment>>(`${this.baseUrl}/payments/${id}/uncash`, { method: 'POST' })
  }

  static async deletePayment(id: number) {
    return this.apiCall<Done>(`${this.baseUrl}/payments/${id}`, { method: 'DELETE' })
  }

  // --- Socio ---
  static async partnerInvoices(filters: ChinaListFilters) {
    return this.apiCall<Page<ChinaOperation> & { counts: ChinaCounts; summary: ChinaSummary }>(`${this.baseUrl}/partner/invoices?${toQuery(filters)}`)
  }

  static async partnerPayableInvoices() {
    return this.apiCall<{ success: boolean; data: ChinaOperation[] }>(`${this.baseUrl}/partner/payable-invoices`)
  }

  static async partnerPayments(filters: ChinaListFilters) {
    return this.apiCall<Page<ChinaPayment>>(`${this.baseUrl}/partner/payments?${toQuery(filters)}`)
  }

  static async partnerCreatePayment(payload: ChinaPaymentFormPayload) {
    return this.apiCall<One<ChinaPayment>>(`${this.baseUrl}/partner/payments`, { method: 'POST', body: paymentForm(payload) })
  }

  static async partnerUpdatePayment(id: number, payload: ChinaPaymentFormPayload) {
    return this.apiCall<One<ChinaPayment>>(`${this.baseUrl}/partner/payments/${id}`, { method: 'POST', body: paymentForm(payload) })
  }

  static async partnerDeletePayment(id: number) {
    return this.apiCall<Done>(`${this.baseUrl}/partner/payments/${id}`, { method: 'DELETE' })
  }

  // --- Clientes de Almacén China (socios e importadores) ---
  static async listClients(filters: ChinaListFilters & { type?: string }) {
    return this.apiCall<Page<ChinaClient> & { counts: ChinaCounts; organizations: ChinaOrganizationOption[] }>(`${this.baseUrl}/clients?${toQuery(filters)}`)
  }

  static async getClient(id: number) {
    return this.apiCall<One<ChinaClient>>(`${this.baseUrl}/clients/${id}`)
  }

  static async createClient(payload: ChinaClientPayload) {
    return this.apiCall<One<ChinaClient>>(`${this.baseUrl}/clients`, { method: 'POST', body: payload })
  }

  static async updateClient(id: number, payload: ChinaClientPayload) {
    return this.apiCall<One<ChinaClient>>(`${this.baseUrl}/clients/${id}`, { method: 'POST', body: payload })
  }

  static async deleteClient(id: number) {
    return this.apiCall<Done>(`${this.baseUrl}/clients/${id}`, { method: 'DELETE' })
  }

  // --- Datos bancarios de China (los ve China y el socio; edita China) ---
  static async bankAccount() {
    return this.apiCall<One<ChinaBankAccount>>(`${this.baseUrl}/bank-account`)
  }

  static async updateBankAccount(payload: ChinaBankAccount) {
    return this.apiCall<One<ChinaBankAccount>>(`${this.baseUrl}/bank-account`, { method: 'PUT', body: payload })
  }

  // --- Documentos PDF (siempre del backend) con historial ---
  private static documentsUrl(target: ChinaDocumentTarget): string {
    const base = target.mode === 'partner' ? `${this.baseUrl}/partner` : this.baseUrl
    if (target.kind === 'invoice') return `${base}/operations/${target.operationId}/documents`
    return target.mode === 'partner' ? `${base}/balance-documents` : `${base}/organizations/${target.organizationId}/balance-documents`
  }

  static async documentHistory(target: ChinaDocumentTarget) {
    return this.apiCall<{ success: boolean; data: ChinaDocument[] }>(this.documentsUrl(target))
  }

  static async issueDocument(target: ChinaDocumentTarget) {
    return this.apiCall<One<ChinaDocument>>(this.documentsUrl(target), { method: 'POST' })
  }
}
