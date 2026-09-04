import { ref } from 'vue'
import { SoporteTiService } from '~/services/soporteTiService'
import type { SoporteTiHorarioAtencionApi } from '~/services/soporteTi/apiTypes'

export interface SoporteTiHorarioDia {
  id: number
  diaSemana: number
  nombreDia: string
  activo: boolean
  horaInicio: string
  horaFin: string
  timezone: string
  updatedAt: string | null
}

const NOMBRES_DIA = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function mapDia(row: SoporteTiHorarioAtencionApi): SoporteTiHorarioDia {
  return {
    id: row.id,
    diaSemana: row.dia_semana,
    nombreDia: NOMBRES_DIA[row.dia_semana] ?? `Día ${row.dia_semana}`,
    activo: row.activo,
    horaInicio: row.hora_inicio,
    horaFin: row.hora_fin,
    timezone: row.timezone,
    updatedAt: row.updated_at ?? null,
  }
}

export function useSoporteTiHorarioAtencion() {
  const dias = ref<SoporteTiHorarioDia[]>([])
  const loading = ref(false)
  const guardando = ref(false)
  const error = ref<string | null>(null)

  async function cargar() {
    loading.value = true
    error.value = null
    try {
      const res = await SoporteTiService.getHorarioAtencion()
      if (!res.success || !res.data) throw new Error(res.message || 'No se pudo cargar el horario')
      dias.value = res.data.map(mapDia)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar'
      dias.value = []
    } finally {
      loading.value = false
    }
  }

  async function guardar(diasEdit: SoporteTiHorarioDia[]) {
    guardando.value = true
    try {
      const payload = diasEdit.map((d) => ({
        id: d.id,
        dia_semana: d.diaSemana,
        activo: d.activo,
        hora_inicio: d.horaInicio,
        hora_fin: d.horaFin,
        timezone: d.timezone,
        updated_at: d.updatedAt,
      }))
      const res = await SoporteTiService.updateHorarioAtencion(payload)
      if (!res.success || !res.data) throw new Error(res.message || 'No se pudo guardar')
      dias.value = res.data.map(mapDia)
      return { ok: true as const }
    } finally {
      guardando.value = false
    }
  }

  return { dias, loading, guardando, error, cargar, guardar }
}
