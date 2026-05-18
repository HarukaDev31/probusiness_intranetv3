import { ref } from 'vue'
import { SoporteTiService } from '~/services/soporteTiService'
import type { SoporteTiComplejidad } from '~/utils/soporteTiComplejidad'
import type { SoporteTiSlaHorasApi } from '~/types/soporteTi'

export interface SoporteTiSlaHorasFila {
  id: number
  criticidad: SoporteTiComplejidad
  horas: number
  updatedAt: string | null
}

function mapFila(row: SoporteTiSlaHorasApi): SoporteTiSlaHorasFila {
  return {
    id: row.id,
    criticidad: row.criticidad as SoporteTiComplejidad,
    horas: row.horas,
    updatedAt: row.updated_at ?? null
  }
}

export type SoporteTiSlaAmbitoA = 'pm_fases' | 'analista_config'

export function useSoporteTiSlaHoras(tipo: 'B' | 'A' = 'B', ambito?: SoporteTiSlaAmbitoA) {
  const filas = ref<SoporteTiSlaHorasFila[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function cargar() {
    loading.value = true
    error.value = null
    try {
      const res = await SoporteTiService.getSlaHoras(tipo, tipo === 'A' ? ambito : undefined)
      if (!res.success || !res.data) {
        throw new Error(res.message || 'No se pudieron cargar las horas SLA')
      }
      filas.value = res.data.map(mapFila)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar'
      filas.value = []
    } finally {
      loading.value = false
    }
  }

  async function guardarFila(id: number, horas: number) {
    const res = await SoporteTiService.updateSlaHoras(tipo, [{ id, horas }], tipo === 'A' ? ambito : undefined)
    if (!res.success || !res.data) {
      throw new Error(res.message || 'No se pudo guardar')
    }
    filas.value = res.data.map(mapFila)
    return { ok: true as const }
  }

  async function guardarTodas(items: Array<{ id: number; horas: number }>) {
    const res = await SoporteTiService.updateSlaHoras(tipo, items, tipo === 'A' ? ambito : undefined)
    if (!res.success || !res.data) {
      throw new Error(res.message || 'No se pudo guardar')
    }
    filas.value = res.data.map(mapFila)
    return { ok: true as const }
  }

  return {
    filas,
    loading,
    error,
    cargar,
    guardarFila,
    guardarTodas
  }
}
