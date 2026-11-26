import { computed, ref } from 'vue'
import { ChinaBillingService } from '~/services/chinaBillingService'
import type { ChinaDocument, ChinaDocumentTarget, ChinaOperation } from '~/types/china-billing'

/** Motivos rápidos de la maqueta para cada acción. */
export const CHINA_INVOICE_QUICK_REASONS = {
  new: ['Cambio de monto', 'Cambio de razón social', 'Cambio de datos bancarios', 'Corrección de dirección'],
  current: ['El cliente confirmó esta versión', 'La versión posterior tenía un error'],
  annul: ['Emitida por error', 'El cliente rechazó el documento']
} as const

export const CHINA_INVOICE_STATUS_LABEL: Record<string, string> = {
  vigente: 'Vigente',
  reemplazada: 'No vigente',
  anulada: 'Anulada'
}

export const CHINA_INVOICE_STATUS_PILL: Record<string, string> = {
  vigente: 'bg-success/15 text-success',
  reemplazada: 'bg-elevated text-toned',
  anulada: 'bg-error/10 text-error'
}

export function invoiceTargetFor(operation: ChinaOperation): ChinaDocumentTarget {
  return { kind: 'invoice', mode: 'china', title: `Facturas · ${operation.code}`, operationId: operation.id! }
}

/** Resumen de cambios para el motivo automático de «Actualizar factura». */
export function invoiceChangesText(operation: ChinaOperation): string {
  return (operation.invoice?.changes || []).map((change) => `${change.label}: ${change.from} → ${change.to}`).join('; ')
}

/** Versiones de la factura de una operación: generar, marcar vigente, anular y descargar. */
export function useChinaInvoices() {
  const history = ref<ChinaDocument[]>([])
  const loading = ref(false)

  const current = computed(() => history.value.find((doc) => doc.status === 'vigente') || null)
  const others = computed(() => history.value.filter((doc) => doc.status !== 'vigente'))

  async function load(target: ChinaDocumentTarget) {
    loading.value = true
    try {
      history.value = (await ChinaBillingService.documentHistory(target)).data || []
    } finally {
      loading.value = false
    }
  }

  async function issue(target: ChinaDocumentTarget, reason?: string) {
    const document = (await ChinaBillingService.issueDocument(target, reason)).data
    await ChinaBillingService.downloadDocument(document, target.mode)
    return document
  }

  async function markCurrent(document: ChinaDocument, reason?: string) {
    return (await ChinaBillingService.markCurrentInvoice(document.id, reason)).data
  }

  async function annul(document: ChinaDocument, reason: string) {
    return (await ChinaBillingService.annulInvoice(document.id, reason)).data
  }

  async function download(document: ChinaDocument, mode: 'china' | 'partner' = 'china') {
    await ChinaBillingService.downloadDocument(document, mode)
  }

  /** Descarga la vigente de la operación (sin abrir el historial). */
  async function downloadCurrent(operation: ChinaOperation) {
    const id = operation.invoice?.current?.id
    if (!id) throw new Error('La operación no tiene factura vigente.')
    const target = invoiceTargetFor(operation)
    const docs = (await ChinaBillingService.documentHistory(target)).data || []
    const doc = docs.find((item) => item.id === id)
    if (!doc) throw new Error('No se encontró la factura vigente.')
    await ChinaBillingService.downloadDocument(doc, 'china')
  }

  return { history, loading, current, others, load, issue, markCurrent, annul, download, downloadCurrent }
}
