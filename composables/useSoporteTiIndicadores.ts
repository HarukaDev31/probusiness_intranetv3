import { ref } from 'vue'
import { SoporteTiService } from '~/services/soporteTiService'
import type { SoporteTiIndicadores } from '~/types/soporteTiIndicadores'

export function useSoporteTiIndicadores() {
  const data = ref<SoporteTiIndicadores | null>(null)
  const error = ref<string | null>(null)

  async function cargar(mes?: string | null, area?: string | null) {
    error.value = null
    const res = await SoporteTiService.indicadores({ mes, area })
    if (!res?.success || !res.data) {
      error.value = res?.message || 'No se pudieron cargar los indicadores.'
      throw new Error(error.value)
    }
    data.value = res.data
    return res.data
  }

  return { data, error, cargar }
}
