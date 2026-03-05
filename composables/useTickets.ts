import { ref } from 'vue'
import { TicketService } from '~/services/ticketService'
import { useModal } from '~/composables/commons/useModal'
import type {
  Ticket,
  TicketArchivo,
  TicketFilters,
  UsuarioAsignar
} from '~/types/tickets'

export const useTickets = () => {
  const { showError } = useModal()

  const tickets = ref<Ticket[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  })

  // Estado de detalle
  const currentTicket = ref<Ticket | null>(null)
  const archivos = ref<TicketArchivo[]>([])
  const esDev = ref(false)
  const usuarios = ref<UsuarioAsignar[]>([])

  const loadTickets = async (filters: TicketFilters = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await TicketService.getTickets(filters)
      if (response.success) {
        tickets.value = response.data
        pagination.value = response.pagination
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar tickets'
      showError('Error', error.value!)
    } finally {
      loading.value = false
    }
  }

  const loadTicket = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await TicketService.getTicket(id)
      if (response.success) {
        currentTicket.value = response.data
        archivos.value = response.archivos
        esDev.value = response.es_dev
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar ticket'
    } finally {
      loading.value = false
    }
  }

  const createTicket = async (formData: FormData) => {
    const response = await TicketService.createTicket(formData)
    return response
  }

  const updateTicket = async (id: number, data: Partial<Ticket>) => {
    const response = await TicketService.updateTicket(id, data)
    if (response.success && currentTicket.value?.id === id) {
      currentTicket.value = response.data
    }
    return response
  }

  const addArchivo = async (id: number, formData: FormData) => {
    const response = await TicketService.addArchivo(id, formData)
    if (response.success) {
      await loadTicket(id)
    }
    return response
  }

  const deleteArchivo = async (archivoId: number, ticketId: number) => {
    const response = await TicketService.deleteArchivo(archivoId)
    if (response.success) {
      await loadTicket(ticketId)
    }
    return response
  }

  const loadUsuarios = async () => {
    try {
      const response = await TicketService.getUsuarios()
      if (response.success) {
        usuarios.value = response.data
      }
    } catch {
      // silencioso
    }
  }

  // Labels y colores
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

  const getPrioridadColor = (prioridad: string): 'primary' | 'success' | 'error' | 'warning' | 'neutral' | 'info' => {
    const map: Record<string, any> = {
      baja: 'success',
      media: 'info',
      alta: 'warning',
      critica: 'error'
    }
    return map[prioridad] ?? 'neutral'
  }

  const getPrioridadLabel = (prioridad: string) => {
    const map: Record<string, string> = {
      baja: 'Baja',
      media: 'Media',
      alta: 'Alta',
      critica: 'Crítica'
    }
    return map[prioridad] ?? prioridad
  }

  const getTipoLabel = (tipo: string) => tipo === 'bug' ? 'Bug' : 'Mejora'
  const getTipoColor = (tipo: string): 'error' | 'info' => tipo === 'bug' ? 'error' : 'info'

  return {
    tickets,
    loading,
    error,
    pagination,
    currentTicket,
    archivos,
    esDev,
    usuarios,
    loadTickets,
    loadTicket,
    createTicket,
    updateTicket,
    addArchivo,
    deleteArchivo,
    loadUsuarios,
    getEstadoColor,
    getEstadoLabel,
    getPrioridadColor,
    getPrioridadLabel,
    getTipoLabel,
    getTipoColor
  }
}
