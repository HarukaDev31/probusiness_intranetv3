import { computed, onMounted, onUnmounted, ref, type Ref } from 'vue'
import { formatoContador } from '~/utils/soporteTiContador'

/** Tic cada segundo contra `finIso` del API (gestion.contadorFin). */
export function useSoporteTiContador(activo: Ref<boolean>, finIso: Ref<string | null>) {
  const ahora = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    timer = setInterval(() => {
      ahora.value = Date.now()
    }, 1000)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  const restanteSeg = computed(() => {
    if (!activo.value || !finIso.value) return null
    const fin = new Date(finIso.value).getTime()
    if (Number.isNaN(fin)) return null
    return Math.max(0, Math.floor((fin - ahora.value) / 1000))
  })

  const vencido = computed(() => {
    if (!activo.value || !finIso.value) return false
    const fin = new Date(finIso.value).getTime()
    return !Number.isNaN(fin) && fin <= ahora.value
  })

  const etiqueta = computed(() => {
    if (!activo.value) return null
    if (vencido.value) return '00:00:00'
    if (restanteSeg.value == null) return null
    return formatoContador(restanteSeg.value)
  })

  return { etiqueta, vencido, restanteSeg }
}
