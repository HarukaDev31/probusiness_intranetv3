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

  // Paginación
  const currentPage = ref(1)
  const totalPages = ref(1)
  const totalItems = ref(0)
  const itemsPerPage = ref(15)

  // Filtros
  const filters = ref<NotificationFilters>({
    per_page: 15,
    page: 1
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

  // Métodos principales
  const fetchNotifications = async (newFilters?: Partial<NotificationFilters>) => {
    try {
      loading.value = true
      error.value = null

      if (newFilters) {
        filters.value = { ...filters.value, ...newFilters }
      }

      const response = await NotificationService.getNotifications(filters.value)
      
      notifications.value = response.data.data
      currentPage.value = response.data.current_page
      totalPages.value = response.data.last_page
      totalItems.value = response.data.total
      itemsPerPage.value = response.data.per_page

    } catch (err: any) {
      error.value = err.message || 'Error al cargar notificaciones'
      console.error('Error fetching notifications:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await NotificationService.getUnreadCount()
      
      unreadCount.value = response
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
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (err: any) {
      error.value = err.message || 'Error al marcar como leída'
      console.error('Error marking as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = unreadNotifications.value.map(n => n.id)
      if (unreadIds.length === 0) return

      await NotificationService.markMultipleAsRead(unreadIds)
      
      // Actualizar estado local
      notifications.value.forEach(notification => {
        if (!notification.estado_usuario.leida) {
          notification.estado_usuario.leida = true
          notification.estado_usuario.fecha_lectura = new Date().toISOString()
        }
      })
      
      unreadCount.value = 0
    } catch (err: any) {
      error.value = err.message || 'Error al marcar todas como leídas'
      console.error('Error marking all as read:', err)
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
    
    // Paginación
    currentPage: readonly(currentPage),
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
    getTypeColor,
    getTypeIcon,
    formatDate,
    toLegacyFormat,
    initialize
  }
}