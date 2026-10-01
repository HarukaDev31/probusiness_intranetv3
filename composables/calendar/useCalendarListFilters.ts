import { ref, shallowRef } from 'vue'
import type { CalendarDate } from '@internationalized/date'
import type { CalendarFilters } from '~/types/calendar'
import { toIsoDate } from '~/utils/calendar/dates'

/**
 * Filtros y paginación de las tablas del calendario (progreso y registro de actividades).
 * Las fechas usan shallowRef: un ref normal desenvuelve CalendarDate y pierde su tipo de clase.
 */
export const useCalendarListFilters = (defaultPerPage: number) => {
  const startDate = shallowRef<CalendarDate | null>(null)
  const endDate = shallowRef<CalendarDate | null>(null)
  const responsableIds = ref<number[]>([])
  const contenedorIds = ref<number[]>([])
  const page = ref(1)
  const perPage = ref(defaultPerPage)

  /** Filtros comunes para GET /calendar/events paginado. */
  const buildFilters = (includeContenedores: boolean): CalendarFilters => {
    const filters: CalendarFilters = { page: page.value, per_page: perPage.value }
    if (startDate.value) filters.start_date = toIsoDate(startDate.value)
    if (endDate.value) filters.end_date = toIsoDate(endDate.value)
    if (responsableIds.value.length) filters.responsable_ids = [...responsableIds.value]
    if (includeContenedores && contenedorIds.value.length) filters.contenedor_ids = [...contenedorIds.value]
    return filters
  }

  return { startDate, endDate, responsableIds, contenedorIds, page, perPage, buildFilters }
}
