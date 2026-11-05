import { PagoProveedorService } from '~/services/pagoProveedorService'

const VIGENCIA_MS = 30000

/** Pendientes de Administración que se muestran junto a sus submenús. */
export function useSupplierPaymentCounts() {
  const counts = useState('supplier-payment-counts', () => ({ approvals: 0, executions: 0 }))
  const loadedAt = useState('supplier-payment-counts-at', () => 0)

  async function refresh() {
    if (Date.now() - loadedAt.value < VIGENCIA_MS) return
    loadedAt.value = Date.now()
    try {
      const [approvals, refunds, executions] = await Promise.all([
        PagoProveedorService.listApprovals({ bucket: 'pending', per_page: 1 }),
        PagoProveedorService.listRefunds({ status: 'solicitado', per_page: 1 }),
        PagoProveedorService.listExecutions({ bucket: 'pending', per_page: 1 })
      ])
      counts.value = {
        approvals: Number(approvals.pending_count || 0) + Number(refunds.pending_count || 0),
        executions: Number(executions.pending_count || 0)
      }
    } catch {
      loadedAt.value = 0
    }
  }

  return { counts, refresh }
}
