import type { ScheduleConfig, ScheduleFormData, TimeSlot, TimeSlotFormData } from '~/types/horarios'
import { EntregaService } from '~/services/cargaconsolidada/entrega/entregaService'

export const useHorariosAdmin = () => {
  const schedules = ref<ScheduleConfig[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFechaByDateKey = ref<Record<string, number>>({}) // YYYY-MM-DD -> idFecha

  // Cargar horarios disponibles
  // Permite opcionalmente pasar el id del contenedor para traer los horarios reales desde backend
  const loadSchedules = async (idContenedor?: number) => {
    try {
      loading.value = true
      error.value = null
      if (idContenedor) {
        const resp = await EntregaService.getHorariosDisponibles(idContenedor)
        // Backend shape: [{ date, slots: [{ start_time, end_time, capacity, assigned, available, range_id }] }]
        const result: ScheduleConfig[] = (resp?.data || []).map((d: any) => {
          const date = String(d.date)
          if (d.id_date) {
            lastFechaByDateKey.value[date] = Number(d.id_date)
          }
          const slots: TimeSlot[] = (d.slots || []).map((s: any) => ({
            id: String(s.range_id ?? `${date}-${s.start_time}`),
            time: String(s.start_time),
            endTime: s.end_time ? String(s.end_time) : undefined,
            isAvailable: (Number(s.available) ?? 0) > 0,
            maxCapacity: Number(s.capacity ?? s.delivery_count) ?? undefined,
            currentBookings: Number(s.assigned) ?? 0
          }))
          return {
            id: `sch-${date}`,
            name: `Horario ${date}`,
            description: `Horarios disponibles para ${date}`,
            timeSlots: slots.sort((a, b) => a.time.localeCompare(b.time)),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
        schedules.value = result
      } else {
        // Fallback a simulación actual si no se pasa contenedor
        const response = await $fetch<{ data: ScheduleConfig[] }>('/api/schedules')
        schedules.value = response.data || []
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar horarios'
      console.error('Error loading schedules:', err)
    } finally {
      loading.value = false
    }
  }

  // Crear nueva configuración de horarios
  const createSchedule = async (formData: ScheduleFormData) => {
    try {
      loading.value = true
      error.value = null
      
      // Simular llamada a API - reemplazar con llamada real
      const response = await $fetch<{ data: ScheduleConfig }>('/api/schedules', {
        method: 'POST',
        body: formData
      })
      
      schedules.value.push(response.data)
      return response
    } catch (err: any) {
      error.value = err.message || 'Error al crear horario'
      console.error('Error creating schedule:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Actualizar configuración de horarios
  const updateSchedule = async (id: string, formData: ScheduleFormData) => {
    try {
      loading.value = true
      error.value = null
      
      // Simular llamada a API - reemplazar con llamada real
      const response = await $fetch<{ data: ScheduleConfig }>(`/api/schedules/${id}`, {
        method: 'PUT',
        body: formData
      })
      
      const index = schedules.value.findIndex(s => s.id === id)
      if (index !== -1) {
        schedules.value[index] = response.data
      }
      
      return response
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar horario'
      console.error('Error updating schedule:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Eliminar configuración de horarios
  const deleteSchedule = async (id: string) => {
    try {
      loading.value = true
      error.value = null
      
      // Simular llamada a API - reemplazar con llamada real
      await $fetch(`/api/schedules/${id}`, {
        method: 'DELETE'
      })
      
      schedules.value = schedules.value.filter(s => s.id !== id)
    } catch (err: any) {
      error.value = err.message || 'Error al eliminar horario'
      console.error('Error deleting schedule:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Activar/desactivar configuración
  const toggleScheduleStatus = async (id: string) => {
    try {
      loading.value = true
      error.value = null
      
      const schedule = schedules.value.find(s => s.id === id)
      if (!schedule) throw new Error('Horario no encontrado')
      
      // Simular llamada a API - reemplazar con llamada real
      const response = await $fetch(`/api/schedules/${id}/toggle`, {
        method: 'PATCH'
      })
      
      schedule.isActive = !schedule.isActive
      return response
    } catch (err: any) {
      error.value = err.message || 'Error al cambiar estado'
      console.error('Error toggling schedule status:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Generar horarios por defecto
  const generateDefaultTimeSlots = (): TimeSlotFormData[] => {
    const slots: TimeSlotFormData[] = []
    
    // Horarios de mañana
    for (let hour = 8; hour < 12; hour++) {
      slots.push(
        { time: `${hour.toString().padStart(2, '0')}:00`, isAvailable: true, maxCapacity: 5 },
        { time: `${hour.toString().padStart(2, '0')}:30`, isAvailable: true, maxCapacity: 5 }
      )
    }
    
    // Horarios de tarde
    for (let hour = 14; hour < 18; hour++) {
      slots.push(
        { time: `${hour.toString().padStart(2, '0')}:00`, isAvailable: true, maxCapacity: 5 },
        { time: `${hour.toString().padStart(2, '0')}:30`, isAvailable: true, maxCapacity: 5 }
      )
    }
    
    // Horarios de noche (como en el ejemplo)
    slots.push(
      { time: '19:00', isAvailable: true, maxCapacity: 5 },
      { time: '19:30', isAvailable: true, maxCapacity: 5 },
      { time: '20:30', isAvailable: true, maxCapacity: 5 }
    )
    
    return slots
  }

  // Obtener horarios activos para mostrar en el componente de reservas
  const getActiveSchedules = computed(() => {
    return schedules.value.filter(schedule => schedule.isActive)
  })

  // --- New: Backend-powered helpers ---
  const createFechaIfNeeded = async (idContenedor: number, dateKey: string) => {
    // dateKey: YYYY-MM-DD
    if (lastFechaByDateKey.value[dateKey]) return lastFechaByDateKey.value[dateKey]
    const resp = await EntregaService.createFecha(idContenedor, dateKey)
    const idFecha = Number(resp?.data?.id)
    if (Number.isFinite(idFecha)) {
      lastFechaByDateKey.value[dateKey] = idFecha
    }
    return idFecha
  }

  const createRangoOnDate = async (
    idContenedor: number,
    dateKey: string,
    payload: { start_time: string; end_time: string; delivery_count: number }
  ) => {
    const idFecha = await createFechaIfNeeded(idContenedor, dateKey)
    await EntregaService.createRango(idContenedor, idFecha, payload)
  }

  const deleteRangoOnDate = async (idContenedor: number, idFecha: number, idRango: number) => {
    await EntregaService.deleteRango(idContenedor, idFecha, idRango)
  }

  const updateRangoOnDate = async (
    idContenedor: number,
    idFecha: number,
    idRango: number,
    payload: { start_time: string; end_time: string; delivery_count: number }
  ) => {
    await EntregaService.updateRango(idContenedor, idFecha, idRango, payload)
  }

  return {
    schedules: readonly(schedules),
    loading: readonly(loading),
    error: readonly(error),
    loadSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleScheduleStatus,
    generateDefaultTimeSlots,
    getActiveSchedules,
    // new helpers
    createFechaIfNeeded,
    createRangoOnDate,
    deleteRangoOnDate,
    updateRangoOnDate
  }

  return {
    schedules: readonly(schedules),
    loading: readonly(loading),
    error: readonly(error),
    loadSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleScheduleStatus,
    generateDefaultTimeSlots,
    getActiveSchedules
  }
}
