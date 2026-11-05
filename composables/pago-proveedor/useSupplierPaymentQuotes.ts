import { PagoProveedorService } from '~/services/pagoProveedorService'
import type { PagoProveedorCotizacion, PagoProveedorPaginacion } from '~/types/pago-proveedor'

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

  async function previewWhatsapp(id: number) {
    return PagoProveedorService.vistaPreviaWhatsapp(id)
  }

  async function sendWhatsapp(id: number) {
    return PagoProveedorService.enviarWhatsapp(id)
  }

  async function downloadPdf(id: number) {
    return PagoProveedorService.descargarPdf(id)
  }

  async function renew(id: number) {
    return PagoProveedorService.renovarCotizacion(id, null)
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
    previewWhatsapp,
    sendWhatsapp,
    downloadPdf,
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
