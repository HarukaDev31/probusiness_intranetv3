import { computed } from 'vue'
import { useRoute } from 'vue-router'

/**
 * Lee una ruta de retorno desde el querystring.
 * Ej: ?backTo=/cotizaciones
 */
export function useBackToQuery(queryKey: string = 'backTo') {
  const route = useRoute()

  const backTo = computed(() => {
    const v = route.query[queryKey]
    return typeof v === 'string' && v.trim().length ? v : null
  })

  return { backTo }
}

