import { BaseService } from './base/BaseService'
import type {
  PagoProveedorBusquedaCc,
  PagoProveedorCotizacion,
  PagoProveedorPaginacion,
  PagoProveedorSolicitud
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

  static async guardarFormularioTt(token: string, body: Record<string, unknown>) {
    return this.apiCall<Uno<{ mensaje: string }>>(`${this.baseUrl}/publico/formulario-tt/${token}`, {
      method: 'POST',
      body
    })
  }
}
