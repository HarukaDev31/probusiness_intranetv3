import { ref } from 'vue'
import { SoporteTiService } from '~/services/soporteTiService'
import type { SoporteTiIndicadores } from '~/types/soporteTiIndicadores'

export function useSoporteTiIndicadores() {
  const data = ref<SoporteTiIndicadores | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(true)
  let solicitud = 0

  async function cargar(
    mes?: string | null,
    area?: string | null,
    tab?: 'resumen' | 'detalle' | 'tiempos' | null,
    page?: number | null,
    pageFin?: number | null
  ) {
    const id = ++solicitud
    loading.value = true
    error.value = null
    try {
      const res = await SoporteTiService.indicadores({
        mes,
        area,
        tab,
        page,
        pageFin,
        perPage: 15
      })
      if (id !== solicitud) return res.data
      if (!res?.success || !res.data) {
        error.value = res?.message || 'No se pudieron cargar los indicadores.'
        throw new Error(error.value)
      }
      data.value = res.data
      return res.data
    } finally {
      if (id === solicitud) loading.value = false
    }
  }

  return { data, error, loading, cargar }
}
