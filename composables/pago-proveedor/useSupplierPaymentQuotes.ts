import { PagoProveedorService } from '~/services/pagoProveedorService'
import type {
  PagoProveedorBusquedaCc,
  PagoProveedorCotizacion,
  PagoProveedorDocumento,
  PagoProveedorDocumentoEmitido,
  PagoProveedorPaginacion
} from '~/types/pago-proveedor'

export function useSupplierPaymentQuotes() {
  async function list(params: {
    search?: string
    estado?: string
    consolidado?: string
    resaltar_desde?: number | null
    page?: number
    per_page?: number
  }) {
    return PagoProveedorService.listarCotizaciones(params)
  }

  async function getConfig() {
    return PagoProveedorService.obtenerConfiguracion()
  }

  async function saveValidity(horas: number, tipo: 'habiles' | 'calendario') {
    return PagoProveedorService.guardarVigencia(horas, tipo)
  }

  async function get(id: number) {
    return PagoProveedorService.obtenerCotizacion(id)
  }

  async function findByCc(code: string) {
    return PagoProveedorService.buscarConsolidada(code)
  }

  async function create(codigoCc: string, form: FormData) {
    return PagoProveedorService.crearCotizacion(codigoCc, form)
  }

  async function save(id: number, form: FormData) {
    return PagoProveedorService.guardarCotizacion(id, form)
  }

  async function previewWhatsapp(id: number) {
    return PagoProveedorService.vistaPreviaWhatsapp(id)
  }

  async function sendWhatsapp(id: number) {
    return PagoProveedorService.enviarWhatsapp(id)
  }

  /** Resumen del borrador: el servidor devuelve el PDF ya emitido si nada cambió. */
  async function previewDraft(datos: Record<string, unknown>) {
    return PagoProveedorService.vistaPreviaResumen(datos)
  }

  async function sendDraft(datos: Record<string, unknown>) {
    return PagoProveedorService.enviarResumen(datos)
  }

  async function downloadPdf(id: number) {
    return PagoProveedorService.descargarPdf(id)
  }

  async function downloadDraft(datos: Record<string, unknown>) {
    return PagoProveedorService.pdfResumen(datos)
  }

  async function renew(id: number, tipoCambio?: number | null) {
    return PagoProveedorService.renovarCotizacion(id, tipoCambio)
  }

  async function createRequest(id: number) {
    return PagoProveedorService.crearSolicitud(id)
  }

  async function remove(id: number) {
    return PagoProveedorService.eliminarCotizacion(id)
  }

  return {
    list,
    getConfig,
    saveValidity,
    get,
    findByCc,
    create,
    save,
    previewWhatsapp,
    sendWhatsapp,
    previewDraft,
    sendDraft,
    downloadPdf,
    downloadDraft,
    renew,
    createRequest,
    remove
  }
}

export type QuotesListMeta = {
  data: PagoProveedorCotizacion[]
  pagination: PagoProveedorPaginacion
  consolidados?: string[]
}

export type { PagoProveedorBusquedaCc, PagoProveedorCotizacion, PagoProveedorDocumento, PagoProveedorDocumentoEmitido }
