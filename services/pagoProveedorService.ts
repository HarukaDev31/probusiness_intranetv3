import { BaseService } from './base/BaseService'
import type {
  PagoProveedorBusquedaCc,
  PagoProveedorSugerenciaCc,
  PagoProveedorCotizacion,
  PagoProveedorPaginacion,
  PagoProveedorSolicitud,
  PagoProveedorDocumentoEmitido,
  SupplierPaymentApproval,
  SupplierPaymentApprovalSettings,
  SupplierPaymentExecution,
  SupplierPaymentExecutionTotals,
  SupplierPaymentDeposit,
  SupplierPaymentObservationReason,
  SupplierPaymentRefund,
  SupplierPaymentYuan,
  SupplierPaymentYuanRequest,
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

  static async listarCotizaciones(params: {
    search?: string
    estado?: string
    consolidado?: string
    resaltar_desde?: number | null
    page?: number
    per_page?: number
  }) {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search)
    if (params.estado && params.estado !== 'todos') query.append('estado', params.estado)
    if (params.consolidado && params.consolidado !== 'todos') query.append('consolidado', params.consolidado)
    if (params.resaltar_desde && params.resaltar_desde > 0) query.append('resaltar_desde', String(params.resaltar_desde))
    if (params.page) query.append('page', String(params.page))
    if (params.per_page) query.append('per_page', String(params.per_page))
    return this.apiCall<Lista<PagoProveedorCotizacion> & { consolidados?: string[] }>(
      `${this.baseUrl}/cotizaciones?${query.toString()}`
    )
  }

  static async sugerirConsolidada(params: { q: string; page?: number; per_page?: number }) {
    const query = new URLSearchParams()
    query.append('q', params.q)
    if (params.page) query.append('page', String(params.page))
    if (params.per_page) query.append('per_page', String(params.per_page))
    return this.apiCall<Lista<PagoProveedorSugerenciaCc>>(`${this.baseUrl}/cotizaciones-cc?${query.toString()}`)
  }

  static async buscarConsolidada(codigo: string) {
    return this.apiCall<Uno<PagoProveedorBusquedaCc>>(`${this.baseUrl}/cotizaciones-cc/${encodeURIComponent(codigo.trim().toUpperCase())}`)
  }

  static async crearCotizacion(codCotizacionCc: string, form: FormData) {
    form.set('cod_cotizacion_cc', codCotizacionCc.trim().toUpperCase())
    return this.apiCall<Uno<PagoProveedorCotizacion>>(`${this.baseUrl}/cotizaciones`, {
      method: 'POST',
      body: form
    })
  }

  static async obtenerCotizacion(id: number) {
    return this.apiCall<Uno<PagoProveedorCotizacion>>(`${this.baseUrl}/cotizaciones/${id}`)
  }

  static async guardarCotizacion(id: number, form: FormData) {
    // PHP no procesa archivos en un PUT real: se envía POST y Laravel lo enruta como PUT.
    form.set('_method', 'PUT')
    return this.apiCall<Uno<PagoProveedorCotizacion>>(`${this.baseUrl}/cotizaciones/${id}`, {
      method: 'POST',
      body: form
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

  static async vistaPreviaWhatsapp(id: number) {
    return this.apiCall<Uno<{ texto: string; destinatario: string | null; puede_enviar?: boolean; nota: string }>>(
      `${this.baseUrl}/cotizaciones/${id}/vista-previa-whatsapp`,
      { method: 'POST' }
    )
  }

  static async enviarWhatsapp(id: number) {
    return this.apiCall<Uno<{ texto: string; destinatario: string; enviado: boolean; nota: string }>>(
      `${this.baseUrl}/cotizaciones/${id}/enviar-whatsapp`,
      { method: 'POST' }
    )
  }

  static async descargarPdf(id: number) {
    return this.apiCall<Uno<PagoProveedorDocumentoEmitido>>(`${this.baseUrl}/cotizaciones/${id}/pdf`)
  }

  static async pdfResumen(datos: Record<string, unknown>) {
    return this.apiCall<Uno<PagoProveedorDocumentoEmitido>>(`${this.baseUrl}/cotizaciones/resumen/pdf`, { method: 'POST', body: datos })
  }

  static async vistaPreviaResumen(datos: Record<string, unknown>) {
    return this.apiCall<Uno<{ texto: string; destinatario: string | null; puede_enviar?: boolean; nota: string }>>(
      `${this.baseUrl}/cotizaciones/resumen/vista-previa-whatsapp`,
      { method: 'POST', body: datos }
    )
  }

  static async enviarResumen(datos: Record<string, unknown>) {
    return this.apiCall<Uno<{ texto: string; destinatario: string; enviado: boolean; nota: string }>>(
      `${this.baseUrl}/cotizaciones/resumen/enviar-whatsapp`,
      { method: 'POST', body: datos }
    )
  }

  static async crearSolicitud(cotizacionId: number) {
    return this.apiCall<Uno<PagoProveedorSolicitud>>(`${this.baseUrl}/cotizaciones/${cotizacionId}/solicitud`, {
      method: 'POST'
    })
  }

  static async listarSolicitudes(params: {
    search?: string
    consolidado?: string
    tipo_pago?: string
    etapa?: string | number
    estado?: string
    page?: number
    per_page?: number
  }) {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search)
    if (params.consolidado && params.consolidado !== 'todos') query.append('consolidado', params.consolidado)
    if (params.tipo_pago && params.tipo_pago !== 'todos') query.append('tipo_pago', params.tipo_pago)
    if (params.etapa !== undefined && params.etapa !== null && String(params.etapa) !== 'todos') {
      query.append('etapa', String(params.etapa))
    }
    if (params.estado && params.estado !== 'todos') query.append('estado', params.estado)
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

  static async guardarVigencia(horas: number, tipo: 'habiles' | 'calendario' = 'habiles') {
    return this.apiCall<Uno<{ vigencia_cotizacion_horas: number; vigencia_cotizacion_tipo: string }>>(
      `${this.baseUrl}/configuracion/vigencia`,
      {
        method: 'PUT',
        body: { horas, tipo }
      }
    )
  }

  static async candidatosPedirDatos(solicitudId: number) {
    return this.apiCall<Uno<Array<{ id: number; titulo: string; moneda: string; incompleto: boolean }>>>(
      `${this.baseUrl}/solicitudes/${solicitudId}/pedir-datos`
    )
  }

  static async pedirDatos(solicitudId: number, proveedores?: number[]) {
    return this.apiCall<Uno<{ texto: string; nota: string; solicitud: PagoProveedorSolicitud }>>(
      `${this.baseUrl}/solicitudes/${solicitudId}/pedir-datos`,
      { method: 'POST', body: proveedores?.length ? { proveedores } : {} }
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

  static async completarProveedor(solicitudId: number, proveedorId: number) {
    return this.apiCall<Uno<PagoProveedorSolicitud>>(`${this.baseUrl}/solicitudes/${solicitudId}/proveedores/${proveedorId}/completar`, {
      method: 'POST'
    })
  }

  static async confirmarTipoCambio(solicitudId: number, tipoCambio: number) {
    return this.apiCall<Uno<PagoProveedorSolicitud>>(`${this.baseUrl}/solicitudes/${solicitudId}/tipo-cambio`, {
      method: 'POST',
      body: { tipo_cambio: tipoCambio }
    })
  }

  static async anularProveedor(solicitudId: number, proveedorId: number, motivo: string) {
    return this.apiCall<Uno<PagoProveedorSolicitud>>(`${this.baseUrl}/solicitudes/${solicitudId}/proveedores/${proveedorId}/anular`, {
      method: 'POST',
      body: { motivo }
    })
  }

  static async observarProveedor(solicitudId: number, proveedorId: number, motivo: string) {
    return this.apiCall<Uno<PagoProveedorSolicitud>>(`${this.baseUrl}/solicitudes/${solicitudId}/proveedores/${proveedorId}/observar`, {
      method: 'POST',
      body: { motivo }
    })
  }

  static async levantarObservacion(solicitudId: number, proveedorId: number, motivo: string) {
    return this.apiCall<Uno<PagoProveedorSolicitud>>(`${this.baseUrl}/solicitudes/${solicitudId}/proveedores/${proveedorId}/levantar-observacion`, {
      method: 'POST',
      body: { motivo }
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

  static async extendDepositObservation(id: number, body: { reason: string; days?: number }) {
    return this.apiCall<Uno<SupplierPaymentDeposit>>(`${this.baseUrl}/verificacion/depositos/${id}/extender`, {
      method: 'POST',
      body
    })
  }

  static async cancelDepositPayment(id: number, reason: string) {
    return this.apiCall<Uno<SupplierPaymentDeposit>>(`${this.baseUrl}/verificacion/depositos/${id}/anular-pago`, {
      method: 'POST',
      body: { reason }
    })
  }

  static async listApprovals(params: {
    bucket?: string
    status?: string
    search?: string
    consolidado?: string
    banco?: string
    page?: number
    per_page?: number
  }) {
    const query = new URLSearchParams()
    if (params.bucket) query.append('bucket', params.bucket)
    if (params.status) query.append('status', params.status)
    if (params.search) query.append('search', params.search)
    if (params.consolidado && params.consolidado !== 'todos') query.append('consolidado', params.consolidado)
    if (params.banco && params.banco !== 'todos') query.append('banco', params.banco)
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

  static async markRegistrationError(id: number, detail: string) {
    return this.apiCall<Uno<SupplierPaymentApproval>>(`${this.baseUrl}/aprobaciones/${id}/error-registro`, {
      method: 'POST',
      body: { detail }
    })
  }

  static async extendCollect(id: number, body: { reason: string; days?: number }) {
    return this.apiCall<Uno<SupplierPaymentApproval>>(`${this.baseUrl}/aprobaciones/${id}/extender`, {
      method: 'POST',
      body
    })
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
    banco?: string
    consolidado?: string
    page?: number
    per_page?: number
  }) {
    const query = new URLSearchParams()
    if (params.bucket) query.append('bucket', params.bucket)
    if (params.search) query.append('search', params.search)
    if (params.paid_from) query.append('paid_from', params.paid_from)
    if (params.paid_to) query.append('paid_to', params.paid_to)
    if (params.banco && params.banco !== 'todos') query.append('banco', params.banco)
    if (params.consolidado && params.consolidado !== 'todos') query.append('consolidado', params.consolidado)
    if (params.page) query.append('page', String(params.page))
    if (params.per_page) query.append('per_page', String(params.per_page))
    return this.apiCall<Lista<SupplierPaymentExecution> & {
      pending_count: number
      totals: SupplierPaymentExecutionTotals
    }>(`${this.baseUrl}/ejecuciones?${query.toString()}`)
  }

  static async executionNoticeText(providerId: number, amount: number) {
    return this.apiCall<Uno<{ message: string }>>(`${this.baseUrl}/ejecuciones/${providerId}/aviso?amount=${encodeURIComponent(String(amount))}`)
  }

  static async confirmExecutionNotice(providerId: number, amount: number) {
    return this.apiCall<Uno<{ message: string }>>(`${this.baseUrl}/ejecuciones/${providerId}/aviso`, {
      method: 'POST',
      body: { amount }
    })
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

  static async listYuan(params: { bucket?: string; search?: string; country?: string; date_from?: string; date_to?: string; page?: number; per_page?: number }) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.append(key, String(value))
    })
    return this.apiCall<Lista<SupplierPaymentYuanRequest> & {
      pending_count: number
      indicators: SupplierPaymentYuanIndicators
      counts: { all: number; pending: number; observed: number; paid: number }
      countries: string[]
      partners_by_country: Record<string, string[]>
      clients_by_country: Record<string, string[]>
    }>(`${this.baseUrl}/yuanes?${query.toString()}`)
  }

  static async yuanNoticeText(providerId: number) {
    return this.apiCall<Uno<{ message: string }>>(`${this.baseUrl}/yuanes/${providerId}/aviso`)
  }

  static async confirmYuanNotice(providerId: number, yuanPaid: number) {
    return this.apiCall<Uno<SupplierPaymentYuan>>(`${this.baseUrl}/yuanes/${providerId}/aviso`, {
      method: 'POST',
      body: { yuan_paid: yuanPaid }
    })
  }

  static async liftManualYuan(providerId: number) {
    return this.apiCall<Uno<SupplierPaymentYuan>>(`${this.baseUrl}/yuanes/${providerId}/levantar`, { method: 'POST' })
  }

  static async registerYuan(providerId: number, payload: { yuanPaid: number; paidOn: string; receipt: File | null }) {
    const form = new FormData()
    form.append('yuan_paid', String(payload.yuanPaid))
    form.append('paid_on', payload.paidOn)
    if (payload.receipt) form.append('receipt', payload.receipt)
    return this.apiCall<Uno<SupplierPaymentYuan>>(`${this.baseUrl}/yuanes/${providerId}`, { method: 'POST', body: form })
  }

  static async undoYuan(providerId: number) {
    return this.apiCall<Uno<SupplierPaymentYuan>>(`${this.baseUrl}/yuanes/${providerId}/deshacer`, { method: 'POST' })
  }

  static async addYuanIncome(requestId: number, payload: { usd: number; rate: number; receipt: File | null }) {
    const form = new FormData()
    form.append('usd_amount', String(payload.usd))
    form.append('exchange_rate', String(payload.rate))
    if (payload.receipt) form.append('receipt', payload.receipt)
    return this.apiCall<{ success: boolean; message: string }>(`${this.baseUrl}/yuanes/solicitudes/${requestId}/ingresos`, { method: 'POST', body: form })
  }

  static async removeYuanIncome(incomeId: number) {
    return this.apiCall<{ success: boolean; message: string }>(`${this.baseUrl}/yuanes/ingresos/${incomeId}`, { method: 'DELETE' })
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

  static async enviarBalance(solicitudId: number, proveedorId: number) {
    return this.apiCall<Uno<PagoProveedorSolicitud> & { pdf?: PagoProveedorDocumentoEmitido }>(`${this.baseUrl}/solicitudes/${solicitudId}/proveedores/${proveedorId}/balance`, {
      method: 'POST'
    })
  }

  static async vistaPreviaBalance(solicitudId: number, proveedorId: number) {
    return this.apiCall<Uno<{ texto: string; archivo: string }>>(`${this.baseUrl}/solicitudes/${solicitudId}/proveedores/${proveedorId}/balance/vista-previa`)
  }

  static async descargarBalance(solicitudId: number, proveedorId: number) {
    return this.apiCall<Uno<PagoProveedorDocumentoEmitido>>(`${this.baseUrl}/solicitudes/${solicitudId}/proveedores/${proveedorId}/balance`)
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
    return this.apiCall<Uno<{
      usd: number[]
      rmb: number[]
      tramo_medio: number
      tramo_alto: number
      admin: number
      admin_usd: number
      admin_rmb: number
    }>>(`${this.baseUrl}/aprobaciones/tarifas`)
  }

  static async saveTariffs(body: {
    tipo?: 'bancaria' | 'admin'
    usd?: number[]
    rmb?: number[]
    tramo_medio?: number
    tramo_alto?: number
    admin?: number
    admin_usd?: number
    admin_rmb?: number
  }) {
    return this.apiCall<Uno<Record<string, unknown>>>(`${this.baseUrl}/aprobaciones/tarifas`, { method: 'PUT', body })
  }

  static async createManualYuan(form: FormData) {
    return this.apiCall<Uno<{ request_id: number }>>(`${this.baseUrl}/yuanes/manual`, { method: 'POST', body: form })
  }

  static async updateManualYuan(requestId: number, form: FormData) {
    return this.apiCall<Uno<{ request_id: number }>>(`${this.baseUrl}/yuanes/solicitudes/${requestId}/editar`, { method: 'POST', body: form })
  }

  static async levantarChina(solicitudId: number, proveedorId: number, vendedor: string, wechat: string) {
    return this.apiCall<Uno<PagoProveedorSolicitud>>(`${this.baseUrl}/solicitudes/${solicitudId}/proveedores/${proveedorId}/levantar-china`, {
      method: 'POST',
      body: { vendedor, wechat }
    })
  }
}
