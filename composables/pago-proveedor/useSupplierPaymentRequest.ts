import { PagoProveedorService } from '~/services/pagoProveedorService'

/**
 * Acciones del expediente de una solicitud de Pago a Proveedor.
 * La page solo consume este composable; nunca el service.
 */
export function useSupplierPaymentRequest() {
  const getRequest = (solicitudId: number) => PagoProveedorService.obtenerSolicitud(solicitudId)

  const getDataCandidates = (solicitudId: number) => PagoProveedorService.candidatosPedirDatos(solicitudId)

  const askProviderData = (solicitudId: number, proveedores?: number[]) =>
    PagoProveedorService.pedirDatos(solicitudId, proveedores)

  const previewSummary = (cotizacionId: number) => PagoProveedorService.vistaPreviaWhatsapp(cotizacionId)

  const sendSummary = (cotizacionId: number) => PagoProveedorService.enviarWhatsapp(cotizacionId)

  const previewProviderData = (solicitudId: number, proveedores: number[]) =>
    PagoProveedorService.pedirDatosVistaPrevia(solicitudId, proveedores)

  const sendProviderData = (solicitudId: number, proveedores: number[]) =>
    PagoProveedorService.enviarPedirDatos(solicitudId, proveedores)

  const downloadSummary = (cotizacionId: number) => PagoProveedorService.descargarPdf(cotizacionId)

  const getBankAccounts = (solicitudId: number) => PagoProveedorService.cuentas(solicitudId)

  const liftChina = (solicitudId: number, proveedorId: number, vendedor: string, wechat: string) =>
    PagoProveedorService.levantarChina(solicitudId, proveedorId, vendedor, wechat)

  const saveRmb = (solicitudId: number, proveedorId: number, vendedor: string, wechat: string) =>
    PagoProveedorService.guardarDatosRmb(solicitudId, proveedorId, vendedor, wechat)

  const sendForm = (solicitudId: number, proveedorId: number) =>
    PagoProveedorService.enviarFormulario(solicitudId, proveedorId)

  const fillForm = (solicitudId: number, proveedorId: number, body: Record<string, unknown>) =>
    PagoProveedorService.llenarTt(solicitudId, proveedorId, body)

  const requestValidation = (solicitudId: number, proveedorId: number) =>
    PagoProveedorService.solicitarValidacion(solicitudId, proveedorId)

  const observeProvider = (solicitudId: number, proveedorId: number, motivo: string) =>
    PagoProveedorService.observarProveedor(solicitudId, proveedorId, motivo)

  const cancelProvider = (solicitudId: number, proveedorId: number, motivo: string) =>
    PagoProveedorService.anularProveedor(solicitudId, proveedorId, motivo)

  const liftObservation = (solicitudId: number, proveedorId: number, motivo: string) =>
    PagoProveedorService.levantarObservacion(solicitudId, proveedorId, motivo)

  const registerDeposit = (solicitudId: number, form: FormData, abonoId?: number) =>
    PagoProveedorService.registrarAbono(solicitudId, form, abonoId)

  const cancelDeposit = (solicitudId: number, abonoId: number) =>
    PagoProveedorService.anularAbono(solicitudId, abonoId)

  const chooseContinuation = (solicitudId: number, abonoId: number, proveedores: number[]) =>
    PagoProveedorService.elegirContinuacion(solicitudId, abonoId, proveedores)

  const decideSurplus = (solicitudId: number, abonoId: number, decision: string) =>
    PagoProveedorService.decidirExcedente(solicitudId, abonoId, decision)

  return {
    getRequest,
    getDataCandidates,
    askProviderData,
    previewSummary,
    sendSummary,
    previewProviderData,
    sendProviderData,
    downloadSummary,
    getBankAccounts,
    liftChina,
    saveRmb,
    sendForm,
    fillForm,
    requestValidation,
    observeProvider,
    cancelProvider,
    liftObservation,
    registerDeposit,
    cancelDeposit,
    chooseContinuation,
    decideSurplus
  }
}
