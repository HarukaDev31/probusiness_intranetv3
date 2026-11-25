import { computed } from 'vue'
import { useUserRole } from '~/composables/auth/useUserRole'
import { ROLES } from '~/constants/roles'

/** currentRole agrupa a Encargado China con el almacén; aquí se distingue por el rol real. */
export function useEncargadoChina() {
  const { displayRole } = useUserRole()
  const isEncargadoChina = computed(() => String(displayRole.value || '').trim().toLowerCase() === ROLES.ENCARGADO_CHINA.toLowerCase())
  return { isEncargadoChina }
}
