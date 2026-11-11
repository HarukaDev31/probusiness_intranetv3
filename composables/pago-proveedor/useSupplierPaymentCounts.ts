import { computed } from 'vue'
import { useVerificationCounts } from '~/composables/verificacion/useVerificationCounts'

/** Compat: submenús de Pago a Proveedor leen del mismo estado que Verificación. */
export function useSupplierPaymentCounts() {
  const { counts: verification, refresh } = useVerificationCounts()
  const counts = computed(() => ({
    approvals: verification.value.supplier_approvals,
    executions: verification.value.supplier_executions
  }))

  return { counts, refresh }
}
