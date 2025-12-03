import { ref, computed } from 'vue'
import { NewsService } from '~/services/news/newsService'
import type {
  SystemNews,
  CreateNewsRequest,
  UpdateNewsRequest,
  NewsFilters
} from '~/types/news'

export const useNews = () => {
  const news = ref<SystemNews[]>([])
  const currentNews = ref<SystemNews | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  })

  /**
   * Cargar noticias públicas
   */
  const loadNews = async (filters?: NewsFilters) => {
    try {
      loading.value = true
      error.value = null

      const response = await NewsService.getNews(filters)
      
      if (response.success) {
        news.value = response.data
        pagination.value = response.pagination
      } else {
        throw new Error(response.message || 'Error al cargar noticias')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar noticias'
      console.error('Error en loadNews:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Cargar noticias de administración
   */
  const loadAdminNews = async (filters?: NewsFilters) => {
    try {
      loading.value = true
      error.value = null

      const response = await NewsService.getAdminNews(filters)
      
      if (response.success) {
        news.value = response.data
        pagination.value = response.pagination
      } else {
        throw new Error(response.message || 'Error al cargar noticias')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar noticias'
      console.error('Error en loadAdminNews:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Cargar una noticia específica
   */
  const loadNewsById = async (id: number) => {
    try {
      loading.value = true
      error.value = null

      const response = await NewsService.getNewsById(id)
      
      if (response.success) {
        currentNews.value = response.data
      } else {
        throw new Error(response.message || 'Error al cargar noticia')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar noticia'
      console.error('Error en loadNewsById:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Crear una nueva noticia
   */
  const createNews = async (newsData: CreateNewsRequest) => {
    try {
      loading.value = true
      error.value = null

      const response = await NewsService.createNews(newsData)
      
      if (response.success) {
        // Recargar la lista después de crear
        await loadAdminNews()
        return response.data
      } else {
        throw new Error(response.message || 'Error al crear noticia')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al crear noticia'
      console.error('Error en createNews:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualizar una noticia
   */
  const updateNews = async (id: number, newsData: UpdateNewsRequest) => {
    try {
      loading.value = true
      error.value = null

      const response = await NewsService.updateNews(id, newsData)
      
      if (response.success) {
        // Recargar la lista después de actualizar
        await loadAdminNews()
        return response.data
      } else {
        throw new Error(response.message || 'Error al actualizar noticia')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar noticia'
      console.error('Error en updateNews:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Eliminar una noticia
   */
  const deleteNews = async (id: number) => {
    try {
      loading.value = true
      error.value = null

      const response = await NewsService.deleteNews(id)
      
      if (response.success) {
        // Recargar la lista después de eliminar
        await loadAdminNews()
        return true
      } else {
        throw new Error(response.message || 'Error al eliminar noticia')
      }
    } catch (err: any) {
      error.value = err.message || 'Error al eliminar noticia'
      console.error('Error en deleteNews:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener el color según el tipo
   */
  const getTypeColor = (type: SystemNews['type']) => {
    const colors = {
      update: 'blue',
      feature: 'green',
      fix: 'yellow',
      announcement: 'purple'
    }
    return colors[type] || 'gray'
  }

  /**
   * Obtener el label del tipo
   */
  const getTypeLabel = (type: SystemNews['type']) => {
    const labels = {
      update: 'Actualización',
      feature: 'Nueva Funcionalidad',
      fix: 'Corrección',
      announcement: 'Anuncio'
    }
    return labels[type] || 'Noticia'
  }

  /**
   * Obtener el label de solicitada_por
   */
  const getSolicitadaPorLabel = (solicitadaPor: SystemNews['solicitada_por']) => {
    if (!solicitadaPor) return 'No especificado'
    
    const labels: Record<NonNullable<SystemNews['solicitada_por']>, string> = {
      CEO: 'Por el CEO',
      EQUIPO_DE_COORDINACION: 'Equipo de Coordinación',
      EQUIPO_DE_VENTAS: 'Equipo de Ventas',
      EQUIPO_DE_CURSO: 'Equipo de Curso',
      EQUIPO_DE_DOCUMENTACION: 'Equipo de Documentación',
      ADMINISTRACION: 'Administración',
      EQUIPO_DE_TI: 'Equipo de TI',
      EQUIPO_DE_MARKETING: 'Equipo de Marketing'
    }
    return labels[solicitadaPor] || solicitadaPor
  }

  /**
   * Formatear fecha
   */
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Sin fecha'
    
    const date = new Date(dateString)
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return {
    // State
    news,
    currentNews,
    loading,
    error,
    pagination,
    
    // Methods
    loadNews,
    loadAdminNews,
    loadNewsById,
    createNews,
    updateNews,
    deleteNews,
    
    // Helpers
    getTypeColor,
    getTypeLabel,
    getSolicitadaPorLabel,
    formatDate
  }
}

