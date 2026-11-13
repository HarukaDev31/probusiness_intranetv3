import { computed } from 'vue'
import { ROLES } from '~/constants/roles'
import { SUPPLIER_PAYMENT_PROFILE, type SupplierPaymentProfile } from '~/constants/supplierPayment'
import { useUserRole } from '~/composables/auth/useUserRole'

/**
 * The mock profile switch maps onto roles that already exist.
 * Ventas is Cotizador, Administración is Administración, and China is ContenedorAlmacen.
 */
export function useSupplierPaymentProfile() {
  const { hasRole, fetchCurrentUser } = useUserRole()
  fetchCurrentUser()

  const profile = computed<SupplierPaymentProfile | null>(() => {
    if (hasRole(ROLES.COTIZADOR)) return SUPPLIER_PAYMENT_PROFILE.SALES
    if (hasRole(ROLES.ADMINISTRACION)) return SUPPLIER_PAYMENT_PROFILE.ADMINISTRATION
    if (hasRole(ROLES.CONTENEDOR_ALMACEN)) return SUPPLIER_PAYMENT_PROFILE.WAREHOUSE
    return null
  })

  return { profile }
}
