import { PagoProveedorService } from '~/services/pagoProveedorService'

export function useSupplierPaymentProgress() {
  async function decideInstallment(solicitudId: number, proveedorId: number, choice: string) {
    return PagoProveedorService.decidirCuota(solicitudId, proveedorId, choice)
  }

  async function decidePayment(solicitudId: number, proveedorId: number, choice: string, reason: string) {
    return PagoProveedorService.decidirPago2(solicitudId, proveedorId, choice, reason)
  }

  async function previewBalance(solicitudId: number, proveedorId: number) {
    return PagoProveedorService.vistaPreviaBalance(solicitudId, proveedorId)
  }

  async function sendBalance(solicitudId: number, proveedorId: number) {
    return PagoProveedorService.enviarBalance(solicitudId, proveedorId)
  }

  async function downloadBalance(solicitudId: number, proveedorId: number) {
    return PagoProveedorService.descargarBalance(solicitudId, proveedorId)
  }

  async function registerDifference(solicitudId: number, proveedorId: number, form: FormData) {
    return PagoProveedorService.registrarDiferencia(solicitudId, proveedorId, form)
  }

  async function requestRefund(solicitudId: number, proveedorId: number) {
    return PagoProveedorService.solicitarReembolso(solicitudId, proveedorId)
  }

  async function confirmRate(solicitudId: number, rate: number) {
    return PagoProveedorService.confirmarTipoCambio(solicitudId, rate)
  }

  async function complete(solicitudId: number, proveedorId: number) {
    return PagoProveedorService.completarProveedor(solicitudId, proveedorId)
  }

  return {
    decideInstallment,
    decidePayment,
    previewBalance,
    sendBalance,
    downloadBalance,
    registerDifference,
    requestRefund,
    confirmRate,
    complete
  }
}
