import { ref, computed } from 'vue'
import { useNotifications } from './useNotifications'
import { CampaignService } from '~/services/campaignService'

// Tipos
export interface Campaign {
  id: number
  fecha_creacion: string
  nombre_campana: string
  fecha_inicio: string
  fecha_fin: string
  cantidad_personas: number
}

export interface CampaignData {
  Fe_Inicio: string
  Fe_Fin: string
  Dias_Seleccionados: string[]
}

export interface CampaignFilters {
  mes?: string
  estado?: string
}

export const useCampaigns = () => {
  const { showSuccess, showError, showCreateSuccess, showDeleteSuccess } = useNotifications()
  const { open, close } = useOverlay()

  // Estado reactivo
  const campaigns = ref<Campaign[]>([])
  const loading = ref(false)
  const currentPage = ref(1)
  const itemsPerPage = ref(10)
  const totalPages = ref(1)
  const totalRecords = ref(0)
  const searchQuery = ref('')
  const filters = ref<CampaignFilters>({})

  // Computed properties
  const filteredCampaigns = computed(() => {
    let filtered = campaigns.value

    // Aplicar búsqueda
    if (searchQuery.value) {
      filtered = filtered.filter(campaign =>
        campaign.nombre_campana.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    }

    // Aplicar filtros
    if (filters.value.mes) {
      filtered = filtered.filter(campaign =>
        campaign.nombre_campana.toLowerCase().includes(filters.value.mes!.toLowerCase())
      )
    }

    return filtered
  })


  // Métodos de API
  const loadCampaigns = async () => {
    loading.value = true
    try {
      // Simular llamada a API
      const response = await CampaignService.getCampaigns({
        page: currentPage.value,
        limit: itemsPerPage.value,
        search: searchQuery.value,
        filters: filters.value
      })
      campaigns.value = response.data
      // Aplicar búsqueda
      if (searchQuery.value) {
        campaigns.value = campaigns.value.filter(campaign =>
          campaign.nombre_campana.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      }
      
      // Aplicar filtros
      if (filters.value.mes) {
        campaigns.value = campaigns.value.filter(campaign =>
          campaign.nombre_campana.toLowerCase().includes(filters.value.mes!.toLowerCase())
        )
      }
      
      // Calcular paginación
      totalRecords.value = campaigns.value.length
      totalPages.value = Math.ceil(totalRecords.value / itemsPerPage.value)
      
      const startIndex = (currentPage.value - 1) * itemsPerPage.value
      const endIndex = startIndex + itemsPerPage.value
      campaigns.value = campaigns.value.slice(startIndex, endIndex)
      
    } catch (error) {
      console.error('Error al cargar campañas:', error)
      showError({
        title: 'Error al cargar campañas',
        subtitle: 'No se pudieron obtener los datos',
        message: 'Ha ocurrido un error al cargar la lista de campañas. Intenta nuevamente.'
      })
    } finally {
      loading.value = false
    }
  }

  const createCampaign = async (campaignData: CampaignData) => {
    loading.value = true
    try {
      console.log('Datos de la campaña: composable', campaignData)
      const response = await CampaignService.createCampaign(campaignData)
      return response
      
    } catch (error) {
      console.error('Error al crear campaña:', error)
    
    } finally {
      loading.value = false
    }
  }

  const updateCampaign = async (id: number, campaignData: Partial<Campaign>) => {
    loading.value = true
    try {
      const response = await CampaignService.updateCampaign(id, campaignData)
      
      // Actualizar la campaña en la lista
      const index = campaigns.value.findIndex(c => c.id === id)
      if (index > -1) {
        campaigns.value[index] = response.data
      }
      
      showSuccess({
        title: '¡Actualizado exitosamente!',
        subtitle: 'Campaña actualizada',
        message: 'Los cambios en la campaña se han guardado correctamente.'
      })
      
    } catch (error) {
      console.error('Error al actualizar campaña:', error)
      showError({
        title: 'Error al actualizar campaña',
        subtitle: 'No se pudo actualizar la campaña',
        message: 'Ha ocurrido un error al actualizar la campaña. Intenta nuevamente.'
      })
    } finally {
      loading.value = false
    }
  }

  const deleteCampaign = async (id: number) => {
    loading.value = true
    try {
      // Simular eliminación
      const response = await CampaignService.deleteCampaign(id)
      return response
   
    } catch (error) {
      console.error('Error al eliminar campaña:', error)
      showError({
        title: 'Error al eliminar campaña',
        subtitle: 'No se pudo eliminar la campaña',
        message: 'Ha ocurrido un error al eliminar la campaña. Intenta nuevamente.'
      })
    } finally {
      loading.value = false
    }
  }

  // Métodos de búsqueda y filtros
  const handleSearch = (query: string) => {
    searchQuery.value = query
    currentPage.value = 1
    loadCampaigns()
  }

  const handlePageChange = (page: number) => {
    currentPage.value = page
    loadCampaigns()
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    itemsPerPage.value = newItemsPerPage
    currentPage.value = 1
    loadCampaigns()
  }

  const handleFilterChange = (key: string, value: any) => {
    filters.value[key as keyof CampaignFilters] = value
    currentPage.value = 1
    loadCampaigns()
  }


  return {
    // Estado
    campaigns,
    loading,
    currentPage,
    itemsPerPage,
    totalPages,
    totalRecords,
    searchQuery,
    filters,
    filteredCampaigns,

    // Métodos de API
    loadCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,

    // Métodos de búsqueda y filtros
    handleSearch,
    handlePageChange,
    handleItemsPerPageChange,
    handleFilterChange
  }
}
