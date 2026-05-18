import { computed, ref } from 'vue'
import { SoporteTiService } from '~/services/soporteTiService'
import type { SoporteTiFaseHorasACeldaApi, SoporteTiFaseHorasAMatrizApi } from '~/types/soporteTi'
import { SOPORTE_TI_COMPLEJIDADES } from '~/utils/soporteTiComplejidad'

export interface SoporteTiFaseHorasACelda {
  id: number
  faseCodigo: string
  faseNombre: string
  criticidad: string
  horas: number
  updatedAt: string | null
}

function mapCelda(row: SoporteTiFaseHorasACeldaApi): SoporteTiFaseHorasACelda {
  return {
    id: row.id,
    faseCodigo: row.fase_codigo,
    faseNombre: row.fase_nombre,
    criticidad: row.criticidad,
    horas: row.horas,
    updatedAt: row.updated_at ?? null
  }
}

function mapMatriz(data: SoporteTiFaseHorasAMatrizApi) {
  return {
    fases: data.fases ?? [],
    complejidades: data.complejidades?.length ? data.complejidades : [...SOPORTE_TI_COMPLEJIDADES],
    celdas: (data.celdas ?? []).map(mapCelda)
  }
}

export function useSoporteTiFaseHorasA() {
  const fases = ref<{ codigo: string; nombre: string }[]>([])
  const complejidades = ref<string[]>([...SOPORTE_TI_COMPLEJIDADES])
  const celdas = ref<SoporteTiFaseHorasACelda[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const indiceCeldas = computed(() => {
    const map = new Map<string, SoporteTiFaseHorasACelda>()
    for (const c of celdas.value) {
      map.set(`${c.criticidad}|${c.faseCodigo}`, c)
    }
    return map
  })

  function celda(criticidad: string, faseCodigo: string): SoporteTiFaseHorasACelda | undefined {
    return indiceCeldas.value.get(`${criticidad}|${faseCodigo}`)
  }

  function totalFila(criticidad: string): number {
    return fases.value.reduce((acc, f) => {
      const c = celda(criticidad, f.codigo)
      return acc + (c?.horas ?? 0)
    }, 0)
  }

  async function cargar() {
    loading.value = true
    error.value = null
    try {
      const res = await SoporteTiService.getFaseHorasA()
      if (!res.success || !res.data) {
        throw new Error(res.message || 'No se pudieron cargar las horas por fase')
      }
      const m = mapMatriz(res.data)
      fases.value = m.fases
      complejidades.value = m.complejidades
      celdas.value = m.celdas
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar'
      fases.value = []
      celdas.value = []
    } finally {
      loading.value = false
    }
  }

  async function guardarCeldas(items: Array<{ id: number; horas: number }>) {
    const res = await SoporteTiService.updateFaseHorasA(items)
    if (!res.success || !res.data) {
      throw new Error(res.message || 'No se pudo guardar')
    }
    const m = mapMatriz(res.data)
    fases.value = m.fases
    complejidades.value = m.complejidades
    celdas.value = m.celdas
    return { ok: true as const }
  }

  async function guardarCelda(id: number, horas: number) {
    return guardarCeldas([{ id, horas }])
  }

  return {
    fases,
    complejidades,
    celdas,
    loading,
    error,
    celda,
    totalFila,
    cargar,
    guardarCelda,
    guardarCeldas
  }
}
