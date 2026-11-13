import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { PagoProveedorService } from '~/services/pagoProveedorService'
import type { SupplierPaymentRefund } from '~/types/pago-proveedor'

export function useSupplierPaymentRefunds() {
  const { showSuccess, showError } = useModal()
  const { withSpinner } = useSpinner()

  const rows = useState<SupplierPaymentRefund[]>('supplier-payment-refunds-rows', () => [])
  const loading = useState('supplier-payment-refunds-loading', () => false)
  const bucket = useState<'solicitado' | 'aprobado'>('supplier-payment-refunds-bucket', () => 'solicitado')
  const pendingCount = useState('supplier-payment-refunds-pending', () => 0)

  async function load() {
    loading.value = true
    try {
      const response = await PagoProveedorService.listRefunds({
        status: bucket.value,
        per_page: 50
      })
      rows.value = response?.data || []
      pendingCount.value = Number(response?.pending_count ?? rows.value.filter((row) => row.can_approve).length)
    } catch (error: any) {
      showError('Reembolsos', error?.data?.message || 'No se pudo cargar.')
    } finally {
      loading.value = false
    }
  }

  function changeBucket(next: 'solicitado' | 'aprobado') {
    bucket.value = next
    return load()
  }

  async function approve(id: number, body: FormData) {
    await withSpinner(async () => {
      await PagoProveedorService.approveRefund(id, body)
    }, 'Registrando voucher…')
    showSuccess('Reembolso', 'El voucher quedó registrado.')
    await load()
  }

  async function reject(id: number, reason: string) {
    await withSpinner(async () => {
      await PagoProveedorService.rejectRefund(id, reason)
    }, 'Rechazando…')
    showSuccess('Reembolso', 'El reembolso quedó rechazado.')
    await load()
  }

  return {
    rows,
    loading,
    bucket,
    pendingCount,
    load,
    changeBucket,
    approve,
    reject
  }
}
