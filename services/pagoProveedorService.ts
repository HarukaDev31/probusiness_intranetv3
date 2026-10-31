import { BaseService } from './base/BaseService'
import type {
  PagoProveedorBusquedaCc,
  PagoProveedorCotizacion,
  PagoProveedorPaginacion,
  PagoProveedorSolicitud,
  SupplierPaymentApproval,
  SupplierPaymentApprovalSettings,
  SupplierPaymentExecution,
  SupplierPaymentExecutionTotals,
  SupplierPaymentDeposit,
  SupplierPaymentObservationReason,
  SupplierPaymentRefund,
  SupplierPaymentYuan,
  SupplierPaymentYuanIndicators
} from '~/types/pago-proveedor'

interface Lista<T> {
  success: boolean
  data: T[]
  pagination: PagoProveedorPaginacion
}

interface Uno<T> {
  success: boolean
  data: T
}

export class PagoProveedorService extends BaseService {
  private static baseUrl = '/api/pago-proveedor'

  static async listarCotizaciones(params: { search?: string; estado?: string; page?: number; per_page?: number }) {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search)
    if (params.estado && params.estado !== 'todos') query.append('estado', params.estado)
    if (params.page) query.append('page', String(params.page))
    if (params.per_page) query.append('per_page', String(params.per_page))
    return this.apiCall<Lista<PagoProveedorCotizacion>>(`${this.baseUrl}/cotizaciones?${query.toString()}`)
  }

  static async buscarConsolidada(codigo: string) {
    return this.apiCall<Uno<PagoProveedorBusquedaCc>>(`${this.baseUrl}/cotizaciones-cc/${encodeURIComponent(codigo.trim().toUpperCase())}`)
  }

  static async crearCotizacion(codCotizacionCc: string) {
    return this.apiCall<Uno<PagoProveedorCotizacion>>(`${this.baseUrl}/cotizaciones`, {
      method: 'POST',
      body: { cod_cotizacion_cc: codCotizacionCc.trim().toUpperCase() }
    })
  }

  static async obtenerCotizacion(id: number) {
    return this.apiCall<Uno<PagoProveedorCotizacion>>(`${this.baseUrl}/cotizaciones/${id}`)
  }

  static async guardarCotizacion(id: number, body: Record<string, unknown>) {
    return this.apiCall<Uno<PagoProveedorCotizacion>>(`${this.baseUrl}/cotizaciones/${id}`, {
      method: 'PUT',
      body
    })
  }

  static async eliminarCotizacion(id: number) {
    return this.apiCall<Uno<unknown>>(`${this.baseUrl}/cotizaciones/${id}`, { method: 'DELETE' })
  }

  static async renovarCotizacion(id: number, tipoCambio?: number | null) {
    return this.apiCall<Uno<PagoProveedorCotizacion>>(`${this.baseUrl}/cotizaciones/${id}/renovar`, {
      method: 'POST',
      body: tipoCambio ? { tipo_cambio: tipoCambio } : {}
    })
  }

  static async subirProforma(cotizacionId: number, proveedorId: number, archivo: File) {
    const form = new FormData()
    form.append('proforma', archivo)
    return this.apiCall<Uno<PagoProveedorCotizacion>>(
      `${this.baseUrl}/cotizaciones/${cotizacionId}/proveedores/${proveedorId}/proforma`,
      { method: 'POST', body: form }
    )
  }

  static async vistaPreviaWhatsapp(id: number) {
    return this.apiCall<Uno<{ texto: string; destinatario: string | null; nota: string }>>(
      `${this.baseUrl}/cotizaciones/${id}/vista-previa-whatsapp`,
      { method: 'POST' }
    )
  }

  static async descargarPdf(id: number) {
    return this.apiCall<Uno<{ filename: string; base64: string }>>(`${this.baseUrl}/cotizaciones/${id}/pdf`)
  }

  static async crearSolicitud(cotizacionId: number) {
    return this.apiCall<Uno<PagoProveedorSolicitud>>(`${this.baseUrl}/cotizaciones/${cotizacionId}/solicitud`, {
      method: 'POST'
    })
  }

  static async listarSolicitudes(params: { search?: string; page?: number; per_page?: number }) {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search)
    if (params.page) query.append('page', String(params.page))
    if (params.per_page) query.append('per_page', String(params.per_page))
    return this.apiCall<Lista<PagoProveedorSolicitud>>(`${this.baseUrl}/solicitudes?${query.toString()}`)
  }

  static async obtenerSolicitud(id: number) {
    return this.apiCall<Uno<PagoProveedorSolicitud>>(`${this.baseUrl}/solicitudes/${id}`)
  }

  static async obtenerConfiguracion() {
    return this.apiCall<Uno<Record<string, unknown>>>(`${this.baseUrl}/configuracion`)
  }

  static async guardarVigencia(horas: number) {
    return this.apiCall<Uno<{ vigencia_cotizacion_horas: number }>>(`${this.baseUrl}/configuracion/vigencia`, {
      method: 'PUT',
      body: { horas }
    })
  }

  static async pedirDatos(solicitudId: number) {
    return this.apiCall<Uno<{ texto: string; nota: string; solicitud: PagoProveedorSolicitud }>>(
      `${this.baseUrl}/solicitudes/${solicitudId}/pedir-datos`,
      { method: 'POST' }
    )
  }

  static async cuentas(solicitudId: number) {
    return this.apiCall<Uno<{ texto: string; nota: string }>>(`${this.baseUrl}/solicitudes/${solicitudId}/cuentas`, {
      method: 'POST'
    })
  }

  static async guardarDatosRmb(solicitudId: number, proveedorId: number, vendedor: string, wechat: string) {
    return this.apiCall<Uno<PagoProveedorSolicitud>>(`${this.baseUrl}/solicitudes/${solicitudId}/proveedores/${proveedorId}/datos-rmb`, {
      method: 'POST',
      body: { vendedor_nombre: vendedor, wechat }
    })
  }

  static async enviarFormulario(solicitudId: number, proveedorId: number) {
    return this.apiCall<Uno<{ enlace: string; texto: string; nota: string; solicitud: PagoProveedorSolicitud }>>(
      `${this.baseUrl}/solicitudes/${solicitudId}/proveedores/${proveedorId}/enviar-formulario`,
      { method: 'POST' }
    )
  }

  static async llenarTt(solicitudId: number, proveedorId: number, body: Record<string, unknown>) {
    return this.apiCall<Uno<PagoProveedorSolicitud>>(`${this.baseUrl}/solicitudes/${solicitudId}/proveedores/${proveedorId}/llenar-tt`, {
      method: 'POST',
      body
    })
  }

  static async solicitarValidacion(solicitudId: number, proveedorId: number) {
    return this.apiCall<Uno<{ enlace: string; texto: string; solicitud: PagoProveedorSolicitud }>>(
      `${this.baseUrl}/solicitudes/${solicitudId}/proveedores/${proveedorId}/solicitar-validacion`,
      { method: 'POST' }
    )
  }

  static async decidirCuota(solicitudId: number, proveedorId: number, choice: string) {
    return this.apiCall<Uno<PagoProveedorSolicitud>>(`${this.baseUrl}/solicitudes/${solicitudId}/proveedores/${proveedorId}/cuota-2`, {
      method: 'POST',
      body: { choice }
    })
  }

  static async confirmarTipoCambio(solicitudId: number, tipoCambio: number) {
    return this.apiCall<Uno<PagoProveedorSolicitud>>(`${this.baseUrl}/solicitudes/${solicitudId}/tipo-cambio`, {
      method: 'POST',
      body: { tipo_cambio: tipoCambio }
    })
  }

  static async anularProveedor(solicitudId: number, proveedorId: number) {
    return this.apiCall<Uno<PagoProveedorSolicitud>>(`${this.baseUrl}/solicitudes/${solicitudId}/proveedores/${proveedorId}/anular`, {
      method: 'POST'
    })
  }

  static async registrarAbono(solicitudId: number, form: FormData, abonoId?: number) {
    const url = abonoId
      ? `${this.baseUrl}/solicitudes/${solicitudId}/abonos/${abonoId}`
      : `${this.baseUrl}/solicitudes/${solicitudId}/abonos`
    return this.apiCall<Uno<{ solicitud: PagoProveedorSolicitud; aviso_operacion_repetida: string | null }>>(url, {
      method: 'POST',
      body: form
    })
  }

  static async anularAbono(solicitudId: number, abonoId: number) {
    return this.apiCall<Uno<PagoProveedorSolicitud>>(`${this.baseUrl}/solicitudes/${solicitudId}/abonos/${abonoId}/anular`, {
      method: 'POST'
    })
  }

  static async decidirExcedente(solicitudId: number, abonoId: number, decision: string) {
    return this.apiCall<Uno<PagoProveedorSolicitud>>(`${this.baseUrl}/solicitudes/${solicitudId}/abonos/${abonoId}/excedente`, {
      method: 'POST',
      body: { decision }
    })
  }

  static async verFormularioTt(token: string) {
    return this.apiCall<Uno<Record<string, any>>>(`${this.baseUrl}/publico/formulario-tt/${token}`)
  }

  static async listDeposits(params: {
    search?: string
    status?: string
    bank?: string
    consolidation?: string
    paid_from?: string
    paid_to?: string
    page?: number
    per_page?: number
  }) {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search)
    if (params.status) query.append('status', params.status)
    if (params.bank) query.append('bank', params.bank)
    if (params.consolidation) query.append('consolidation', params.consolidation)
    if (params.paid_from) query.append('paid_from', params.paid_from)
    if (params.paid_to) query.append('paid_to', params.paid_to)
    if (params.page) query.append('page', String(params.page))
    if (params.per_page) query.append('per_page', String(params.per_page))
    return this.apiCall<Lista<SupplierPaymentDeposit> & {
      pending_count: number
      reasons: SupplierPaymentObservationReason[]
      consolidations: string[]
    }>(`${this.baseUrl}/verificacion/depositos?${query.toString()}`)
  }

  static async updateDeposit(id: number, body: { bank: string; paid_on: string; operation_number: string }) {
    return this.apiCall<Uno<SupplierPaymentDeposit>>(`${this.baseUrl}/verificacion/depositos/${id}`, {
      method: 'PUT',
      body
    })
  }

  static async validateDeposit(id: number, bankAmount: number) {
    return this.apiCall<Uno<SupplierPaymentDeposit>>(`${this.baseUrl}/verificacion/depositos/${id}/validar`, {
      method: 'POST',
      body: { bank_amount: bankAmount }
    })
  }

  static async observeDeposit(id: number, body: { reason?: string; detail?: string; new_label?: string }) {
    return this.apiCall<Uno<SupplierPaymentDeposit>>(`${this.baseUrl}/verificacion/depositos/${id}/observar`, {
      method: 'POST',
      body
    })
  }

  static async undoDeposit(id: number) {
    return this.apiCall<Uno<SupplierPaymentDeposit>>(`${this.baseUrl}/verificacion/depositos/${id}/deshacer`, {
      method: 'POST'
    })
  }

  static async listApprovals(params: {
    bucket?: string
    status?: string
    search?: string
    page?: number
    per_page?: number
  }) {
    const query = new URLSearchParams()
    if (params.bucket) query.append('bucket', params.bucket)
    if (params.status) query.append('status', params.status)
    if (params.search) query.append('search', params.search)
    if (params.page) query.append('page', String(params.page))
    if (params.per_page) query.append('per_page', String(params.per_page))
    return this.apiCall<Lista<SupplierPaymentApproval> & {
      pending_count: number
      settings: SupplierPaymentApprovalSettings
    }>(`${this.baseUrl}/aprobaciones?${query.toString()}`)
  }

  static async approvePayment(id: number, reason?: string) {
    return this.apiCall<Uno<SupplierPaymentApproval>>(`${this.baseUrl}/aprobaciones/${id}/aprobar`, {
      method: 'POST',
      body: { reason: reason || null }
    })
  }

  static async collectPayment(id: number) {
    return this.apiCall<Uno<SupplierPaymentApproval>>(`${this.baseUrl}/aprobaciones/${id}/cobrar`, { method: 'POST' })
  }

  static async extendCollect(id: number) {
    return this.apiCall<Uno<SupplierPaymentApproval>>(`${this.baseUrl}/aprobaciones/${id}/extender`, { method: 'POST' })
  }

  static async cancelPayment(id: number, reason: string) {
    return this.apiCall<Uno<SupplierPaymentApproval>>(`${this.baseUrl}/aprobaciones/${id}/anular`, {
      method: 'POST',
      body: { reason }
    })
  }

  static async listExecutions(params: {
    bucket?: string
    search?: string
    paid_from?: string
    paid_to?: string
    page?: number
    per_page?: number
  }) {
    const query = new URLSearchParams()
    if (params.bucket) query.append('bucket', params.bucket)
    if (params.search) query.append('search', params.search)
    if (params.paid_from) query.append('paid_from', params.paid_from)
    if (params.paid_to) query.append('paid_to', params.paid_to)
    if (params.page) query.append('page', String(params.page))
    if (params.per_page) query.append('per_page', String(params.per_page))
    return this.apiCall<Lista<SupplierPaymentExecution> & {
      pending_count: number
      totals: SupplierPaymentExecutionTotals
    }>(`${this.baseUrl}/ejecuciones?${query.toString()}`)
  }

  static async registerExecution(providerId: number, realBankFee: number, receipt: File) {
    const form = new FormData()
    form.append('real_bank_fee', String(realBankFee))
    form.append('receipt', receipt)
    return this.apiCall<Uno<SupplierPaymentExecution>>(`${this.baseUrl}/ejecuciones/${providerId}`, {
      method: 'POST',
      body: form
    })
  }

  static async saveApprovalSettings(body: SupplierPaymentApprovalSettings) {
    return this.apiCall<Uno<SupplierPaymentApprovalSettings>>(`${this.baseUrl}/aprobaciones/plazos`, {
      method: 'PUT',
      body
    })
  }

  static async listYuan(params: { bucket?: string; search?: string; page?: number; per_page?: number }) {
    const query = new URLSearchParams()
    if (params.bucket) query.append('bucket', params.bucket)
    if (params.search) query.append('search', params.search)
    if (params.page) query.append('page', String(params.page))
    if (params.per_page) query.append('per_page', String(params.per_page))
    return this.apiCall<Lista<SupplierPaymentYuan> & {
      pending_count: number
      indicators: SupplierPaymentYuanIndicators
      reasons: SupplierPaymentObservationReason[]
    }>(`${this.baseUrl}/yuanes?${query.toString()}`)
  }

  static async registerYuan(providerId: number, realRate: number, yuanPaid: number, receipt: File) {
    const form = new FormData()
    form.append('real_exchange_rate', String(realRate))
    form.append('yuan_paid', String(yuanPaid))
    form.append('receipt', receipt)
    return this.apiCall<Uno<SupplierPaymentYuan>>(`${this.baseUrl}/yuanes/${providerId}`, { method: 'POST', body: form })
  }

  static async observeYuan(providerId: number, body: { reason?: string; detail?: string; new_reason?: string }) {
    return this.apiCall<Uno<SupplierPaymentYuan>>(`${this.baseUrl}/yuanes/${providerId}/observar`, { method: 'POST', body })
  }

  static async decidirPago2(solicitudId: number, proveedorId: number, choice: string, reason?: string) {
    return this.apiCall<Uno<PagoProveedorSolicitud>>(`${this.baseUrl}/solicitudes/${solicitudId}/proveedores/${proveedorId}/pago-2`, {
      method: 'POST',
      body: { choice, reason: reason || null }
    })
  }

  static async registrarDiferencia(solicitudId: number, proveedorId: number, form: FormData) {
    return this.apiCall<Uno<PagoProveedorSolicitud>>(`${this.baseUrl}/solicitudes/${solicitudId}/proveedores/${proveedorId}/diferencia-cambio`, {
      method: 'POST',
      body: form
    })
  }

  static async listRefunds(params: { status?: string; page?: number; per_page?: number }) {
    const query = new URLSearchParams()
    if (params.status) query.append('status', params.status)
    if (params.page) query.append('page', String(params.page))
    if (params.per_page) query.append('per_page', String(params.per_page))
    return this.apiCall<Lista<SupplierPaymentRefund> & { pending_count: number }>(`${this.baseUrl}/reembolsos?${query.toString()}`)
  }

  static async approveRefund(id: number, form: FormData) {
    return this.apiCall<Uno<SupplierPaymentRefund>>(`${this.baseUrl}/reembolsos/${id}/aprobar`, { method: 'POST', body: form })
  }

  static async rejectRefund(id: number, reason: string) {
    return this.apiCall<Uno<SupplierPaymentRefund>>(`${this.baseUrl}/reembolsos/${id}/rechazar`, { method: 'POST', body: { reason } })
  }

  static async solicitarReembolso(solicitudId: number, proveedorId: number) {
    return this.apiCall<Uno<PagoProveedorSolicitud>>(`${this.baseUrl}/solicitudes/${solicitudId}/proveedores/${proveedorId}/reembolso`, { method: 'POST' })
  }

  static async elegirContinuacion(solicitudId: number, abonoId: number, proveedores: number[]) {
    return this.apiCall<Uno<PagoProveedorSolicitud>>(`${this.baseUrl}/solicitudes/${solicitudId}/abonos/${abonoId}/continuan`, {
      method: 'POST',
      body: { proveedores }
    })
  }

  static async getTariffs() {
    return this.apiCall<Uno<{ usd: number[]; rmb: number[]; admin: number }>>(`${this.baseUrl}/aprobaciones/tarifas`)
  }

  static async saveTariffs(body: { usd: number[]; rmb: number[]; admin: number }) {
    return this.apiCall<Uno<Record<string, unknown>>>(`${this.baseUrl}/aprobaciones/tarifas`, { method: 'PUT', body })
  }

  static async createManualYuan(form: FormData) {
    return this.apiCall<Uno<SupplierPaymentYuan>>(`${this.baseUrl}/yuanes/manual`, { method: 'POST', body: form })
  }

  static async levantarChina(solicitudId: number, proveedorId: number, vendedor: string, wechat: string) {
    return this.apiCall<Uno<PagoProveedorSolicitud>>(`${this.baseUrl}/solicitudes/${solicitudId}/proveedores/${proveedorId}/levantar-china`, {
      method: 'POST',
      body: { vendedor, wechat }
    })
  }

  static async guardarFormularioTt(token: string, body: Record<string, unknown>) {
    return this.apiCall<Uno<{ mensaje: string }>>(`${this.baseUrl}/publico/formulario-tt/${token}`, {
      method: 'POST',
      body
    })
  }
}
