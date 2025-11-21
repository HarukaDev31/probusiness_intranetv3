import { ref, computed, watch } from 'vue'
import type { 
  Notification, 
  NotificationFilters, 
  NotificationCreateData,
  LegacyNotification
} from '~/types/notification'
import { NotificationService } from '~/services/notificationService'

export const useNotifications = () => {
  // Estado reactivo
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const unreadCount = ref(0)
  const totalCount = ref(0)
  const readCount = ref(0)

  // Paginación
  const currentPage = ref(1)
  const totalPages = ref(1)
  const totalItems = ref(0)
  const itemsPerPage = ref(15)

  // Filtros
  const filters = ref<NotificationFilters>({
    per_page: 15,
    page: 1,
    no_leidas: true // Por defecto mostrar solo no leídas
  })

  // Computed properties
  const hasNotifications = computed(() => notifications.value.length > 0)
  const hasUnreadNotifications = computed(() => unreadCount.value > 0)
  
  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.estado_usuario.leida)
  )

  const readNotifications = computed(() => 
    notifications.value.filter(n => n.estado_usuario.leida)
  )

  // Método para cambiar de página
  const changePage = async (newPage: number) => {
    console.log('changePage called with:', newPage, 'current:', currentPage.value, 'totalPages:', totalPages.value)
    if (newPage !== currentPage.value && newPage >= 1 && newPage <= totalPages.value) {
      console.log('Changing page from', currentPage.value, 'to', newPage)
      currentPage.value = newPage
      filters.value.page = newPage
      console.log('Filters updated:', filters.value)
      await fetchNotifications()
    } else {
      console.log('Page change rejected:', { newPage, current: currentPage.value, totalPages: totalPages.value })
    }
  }

  // Métodos principales
  const fetchNotifications = async (newFilters?: Partial<NotificationFilters>) => {
    try {
      loading.value = true
      error.value = null

      if (newFilters) {
        // Si newFilters tiene no_leidas explícitamente como undefined, eliminarlo
        const updatedFilters = { ...filters.value, ...newFilters }
        if ('no_leidas' in newFilters && newFilters.no_leidas === undefined) {
          delete updatedFilters.no_leidas
        }
        filters.value = updatedFilters
      }

      console.log('fetchNotifications called with filters:', filters.value)
      const response = await NotificationService.getNotifications(filters.value)
      
      console.log('Respuesta completa del API:', response)
      console.log('response.data:', response.data)
      console.log('response.data.conteos:', response.data.conteos)
      
      notifications.value = response.data.data
      currentPage.value = response.data.current_page
      totalPages.value = response.data.last_page
      totalItems.value = response.data.total
      itemsPerPage.value = response.data.per_page
      
      // Actualizar conteos desde la respuesta del API - SIEMPRE usar los conteos del API
      if (response.conteos) {
        totalCount.value = Number(response.conteos.total) || 0
        unreadCount.value = Number(response.conteos.no_leidas) || 0
        readCount.value = Number(response.conteos.leidas) || 0
        
        console.log('Conteos actualizados desde API:', {
          total: totalCount.value,
          no_leidas: unreadCount.value,
          leidas: readCount.value,
          raw_conteos: response.data.conteos
        })
      } else {
        console.error('ERROR: No se encontraron conteos en la respuesta del API')
        // Si no vienen conteos, mantener los valores actuales (no calcular)
      }
      
      console.log('Response received:', {
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        total: response.data.total,
        per_page: response.data.per_page,
        data_length: response.data.data.length,
        conteos: response.data.conteos
      })

    } catch (err: any) {
      error.value = err.message || 'Error al cargar notificaciones'
      console.error('Error fetching notifications:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchUnreadCount = async () => {
    // Ya no es necesario llamar a este endpoint ya que los conteos vienen en fetchNotifications
    // Se mantiene por compatibilidad pero no hace nada
    try {
      // Los conteos ya se actualizan en fetchNotifications desde response.data.conteos
    } catch (err: any) {
      console.error('Error fetching unread count:', err)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await NotificationService.markAsRead(id)
      
      // Actualizar estado local
      const notification = notifications.value.find(n => n.id === id)
      if (notification && !notification.estado_usuario.leida) {
        notification.estado_usuario.leida = true
        notification.estado_usuario.fecha_lectura = new Date().toISOString()
      }
      
      // Recargar notificaciones para obtener conteos actualizados del API
      await fetchNotifications()
    } catch (err: any) {
      error.value = err.message || 'Error al marcar como leída'
      console.error('Error marking as read:', err)
    }
  }

  const markAllAsRead = async () => {
    loading.value = true
    try {
      // Verificar si hay notificaciones no leídas
      if (unreadCount.value === 0) {
        loading.value = false
        return
      }

      // Obtener todas las notificaciones no leídas
      // Usamos un per_page alto para obtener todas en una sola llamada
      const maxPerPage = 10000 // Número alto para obtener todas
      const allUnreadResponse = await NotificationService.getNotifications({
        no_leidas: true,
        per_page: Math.max(maxPerPage, unreadCount.value),
        page: 1
      })

      const allUnreadIds = allUnreadResponse.data.data.map(n => n.id)
      console.log('Total unread IDs to mark:', allUnreadIds.length, 'out of', unreadCount.value)

      if (allUnreadIds.length === 0) {
        loading.value = false
        return
      }

      // Si hay más páginas de notificaciones no leídas, obtenerlas todas
      if (allUnreadResponse.data.last_page > 1) {
        const additionalPages = []
        for (let page = 2; page <= allUnreadResponse.data.last_page; page++) {
          const pageResponse = await NotificationService.getNotifications({
            no_leidas: true,
            per_page: maxPerPage,
            page: page
          })
          additionalPages.push(...pageResponse.data.data.map(n => n.id))
        }
        allUnreadIds.push(...additionalPages)
        console.log('Total unread IDs after fetching all pages:', allUnreadIds.length)
      }

      // Marcar todas como leídas en el backend
      await NotificationService.markMultipleAsRead(allUnreadIds)
      
      // Actualizar estado local de las notificaciones visibles
      notifications.value.forEach(notification => {
        if (!notification.estado_usuario.leida) {
          notification.estado_usuario.leida = true
          notification.estado_usuario.fecha_lectura = new Date().toISOString()
        }
      })
      
      // Recargar las notificaciones para obtener conteos actualizados del API
      // NO actualizar conteos manualmente, siempre usar los del API
      await fetchNotifications()
    } catch (err: any) {
      error.value = err.message || 'Error al marcar todas como leídas'
      console.error('Error marking all as read:', err)
    } finally {
      loading.value = false
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await NotificationService.handleNotificationClick(notification)
      
      // Actualizar estado local si no estaba leída
      if (!notification.estado_usuario.leida) {
        notification.estado_usuario.leida = true
        notification.estado_usuario.fecha_lectura = new Date().toISOString()
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (err: any) {
      error.value = err.message || 'Error al procesar notificación'
      console.error('Error handling notification click:', err)
    }
  }

  const deleteNotification = async (id: number) => {
    try {
      const index = notifications.value.findIndex(n => n.id === id)
      if (index > -1) {
        const notification = notifications.value[index]
        
        if (!notification.estado_usuario.leida) {
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
        
        notifications.value.splice(index, 1)
        totalItems.value = Math.max(0, totalItems.value - 1)
      }
    } catch (err: any) {
      error.value = err.message || 'Error al eliminar notificación'
      console.error('Error deleting notification:', err)
    }
  }

  // Métodos de utilidad
  const getTypeColor = (tipo: Notification['tipo']) => 
    NotificationService.getTypeColor(tipo)

  const getTypeIcon = (tipo: Notification['tipo']) => 
    NotificationService.getTypeIcon(tipo)

  const formatDate = (dateString: string) => 
    NotificationService.formatDate(dateString)

  // Compatibilidad con formato legacy
  const toLegacyFormat = (notification: Notification): LegacyNotification => 
    NotificationService.toLegacyFormat(notification)

  const legacyNotifications = computed(() => 
    notifications.value.map(toLegacyFormat)
  )

  // Inicialización
  const initialize = async () => {
    await Promise.all([
      fetchNotifications(),
      fetchUnreadCount()
    ])
  }

  return {
    // Estado
    notifications: readonly(notifications),
    loading: readonly(loading),
    error: readonly(error),
    unreadCount: readonly(unreadCount),
    totalCount: readonly(totalCount),
    readCount: readonly(readCount),
    
    // Paginación
    currentPage,
    totalPages: readonly(totalPages),
    totalItems: readonly(totalItems),
    itemsPerPage: readonly(itemsPerPage),
    
    // Computed
    hasNotifications,
    hasUnreadNotifications,
    unreadNotifications,
    readNotifications,
    legacyNotifications,
    
    // Métodos
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    handleNotificationClick,
    deleteNotification,
    changePage,
    getTypeColor,
    getTypeIcon,
    formatDate,
    toLegacyFormat,
    initialize
  }
}