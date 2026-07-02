import { computed, onMounted, onUnmounted, ref, type Ref } from 'vue'
import { formatoContador } from '~/utils/soporteTiContador'

/**
 * Contador regresivo SLA. Si está pausado (p. ej. Desplegado), el tiempo restante no decrece.
 */
export function useSoporteTiContador(
  activo: Ref<boolean>,
  finIso: Ref<string | null>,
  pausado: Ref<boolean> = ref(false),
  restanteSegundosFijo: Ref<number | null> = ref(null)
) {
  const ahora = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    timer = setInterval(() => {
      if (!pausado.value) {
        ahora.value = Date.now()
      }
    }, 1000)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  const restanteSeg = computed(() => {
    if (!activo.value) return null
    if (pausado.value && restanteSegundosFijo.value != null) {
      return Math.max(0, Math.floor(restanteSegundosFijo.value))
    }
    if (!finIso.value) return null
    const fin = new Date(finIso.value).getTime()
    if (Number.isNaN(fin)) return null
    return Math.max(0, Math.floor((fin - ahora.value) / 1000))
  })

  const vencido = computed(() => {
    if (!activo.value) return false
    if (restanteSeg.value != null) return restanteSeg.value <= 0
    return false
  })

  const etiqueta = computed(() => {
    if (!activo.value) return null
    if (vencido.value) return '00:00:00'
    if (restanteSeg.value == null) return null
    return formatoContador(restanteSeg.value)
  })

  return { etiqueta, vencido, restanteSeg }
}
