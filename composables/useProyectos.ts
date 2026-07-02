import { ref } from 'vue'
import { ProyectoService } from '~/services/proyectoService'
import { useModal } from '~/composables/commons/useModal'
import type {
  Proyecto,
  ProyectoArchivo,
  ProyectoFilters
} from '~/types/tickets'

export const useProyectos = () => {
  const { showError } = useModal()

  const proyectos = ref<Proyecto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  })

  // Estado de detalle
  const currentProyecto = ref<Proyecto | null>(null)
  const requerimientos = ref<ProyectoArchivo[]>([])
  const docsTecnicos = ref<ProyectoArchivo[]>([])
  const esDev = ref(false)

  const loadProyectos = async (filters: ProyectoFilters = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await ProyectoService.getProyectos(filters)
      if (response.success) {
        proyectos.value = response.data
        pagination.value = response.pagination
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar proyectos'
      showError('Error', error.value!)
    } finally {
      loading.value = false
    }
  }

  const loadProyecto = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await ProyectoService.getProyecto(id)
      if (response.success) {
        currentProyecto.value = response.data
        requerimientos.value = response.requerimientos
        docsTecnicos.value = response.docs_tecnicos
        esDev.value = response.es_dev
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar proyecto'
    } finally {
      loading.value = false
    }
  }

  const createProyecto = async (formData: FormData) => {
    const response = await ProyectoService.createProyecto(formData)
    return response
  }

  const updateProyecto = async (id: number, data: Partial<Proyecto>) => {
    const response = await ProyectoService.updateProyecto(id, data)
    if (response.success && currentProyecto.value?.id === id) {
      currentProyecto.value = response.data
    }
    return response
  }

  const addArchivo = async (id: number, tipo: string, formData: FormData) => {
    const response = await ProyectoService.addArchivo(id, tipo, formData)
    if (response.success) {
      await loadProyecto(id)
    }
    return response
  }

  const deleteArchivo = async (archivoId: number, proyectoId: number) => {
    const response = await ProyectoService.deleteArchivo(archivoId)
    if (response.success) {
      await loadProyecto(proyectoId)
    }
    return response
  }

  const getEstadoColor = (estado: string): 'primary' | 'success' | 'error' | 'warning' | 'neutral' | 'info' => {
    const map: Record<string, any> = {
      abierto: 'info',
      en_progreso: 'primary',
      en_revision: 'warning',
      cerrado: 'neutral'
    }
    return map[estado] ?? 'neutral'
  }

  const getEstadoLabel = (estado: string) => {
    const map: Record<string, string> = {
      abierto: 'Abierto',
      en_progreso: 'En Progreso',
      en_revision: 'En Revisión',
      cerrado: 'Cerrado'
    }
    return map[estado] ?? estado
  }

  return {
    proyectos,
    loading,
    error,
    pagination,
    currentProyecto,
    requerimientos,
    docsTecnicos,
    esDev,
    loadProyectos,
    loadProyecto,
    createProyecto,
    updateProyecto,
    addArchivo,
    deleteArchivo,
    getEstadoColor,
    getEstadoLabel
  }
}
