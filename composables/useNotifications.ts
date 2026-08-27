import { ref, computed, readonly } from 'vue'
import type {
  Notification,
  NotificationFilters,
  LegacyNotification
} from '~/types/notification'
import { NotificationService } from '~/services/notificationService'

// Singleton: el badge del sidebar y la página de notificaciones comparten el mismo conteo.
const notifications = ref<Notification[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const unreadCount = ref(0)
const totalCount = ref(0)
const readCount = ref(0)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const itemsPerPage = ref(15)
const filters = ref<NotificationFilters>({
  per_page: 15,
  page: 1,
  no_leidas: true
})

let fetchUnreadInFlight: Promise<number> | null = null

export const useNotifications = () => {
  const hasNotifications = computed(() => notifications.value.length > 0)
  const hasUnreadNotifications = computed(() => unreadCount.value > 0)

  const unreadNotifications = computed(() =>
    notifications.value.filter(n => !n.estado_usuario.leida)
  )

  const readNotifications = computed(() =>
    notifications.value.filter(n => n.estado_usuario.leida)
  )

  const setUnreadCount = (count: number) => {
    unreadCount.value = Math.max(0, Number(count) || 0)
  }

  const changePage = async (newPage: number) => {
    if (newPage !== currentPage.value && newPage >= 1 && newPage <= totalPages.value) {
      currentPage.value = newPage
      filters.value.page = newPage
      await fetchNotifications()
    }
  }

  const fetchNotifications = async (newFilters?: Partial<NotificationFilters>) => {
    try {
      loading.value = true
      error.value = null

      if (newFilters) {
        const updatedFilters = { ...filters.value, ...newFilters }
        if ('no_leidas' in newFilters && newFilters.no_leidas === undefined) {
          delete updatedFilters.no_leidas
        }
        filters.value = updatedFilters
      }

      const response = await NotificationService.getNotifications(filters.value)

      notifications.value = response.data.data
      currentPage.value = response.data.current_page
      totalPages.value = response.data.last_page
      totalItems.value = response.data.total
      itemsPerPage.value = response.data.per_page

      if (response.conteos) {
        totalCount.value = Number(response.conteos.total) || 0
        unreadCount.value = Number(response.conteos.no_leidas) || 0
        readCount.value = Number(response.conteos.leidas) || 0
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar notificaciones'
      console.error('Error fetching notifications:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchUnreadCount = async (): Promise<number> => {
    if (fetchUnreadInFlight) {
      return fetchUnreadInFlight
    }

    fetchUnreadInFlight = (async () => {
      try {
        const count = await NotificationService.getUnreadCount()
        unreadCount.value = Number(count) || 0
        return unreadCount.value
      } catch (err: any) {
        console.error('Error fetching unread count:', err)
        return unreadCount.value
      } finally {
        fetchUnreadInFlight = null
      }
    })()

    return fetchUnreadInFlight
  }

  const markAsRead = async (id: number) => {
    try {
      await NotificationService.markAsRead(id)

      const notification = notifications.value.find(n => n.id === id)
      if (notification && !notification.estado_usuario.leida) {
        notification.estado_usuario.leida = true
        notification.estado_usuario.fecha_lectura = new Date().toISOString()
        unreadCount.value = Math.max(0, unreadCount.value - 1)
        readCount.value = readCount.value + 1
      } else {
        await fetchUnreadCount()
      }
    } catch (err: any) {
      error.value = err.message || 'Error al marcar como leída'
      console.error('Error marking as read:', err)
    }
  }

  const markAllAsRead = async () => {
    loading.value = true
    try {
      if (unreadCount.value === 0) {
        loading.value = false
        return
      }

      const maxPerPage = 10000
      const allUnreadResponse = await NotificationService.getNotifications({
        no_leidas: true,
        per_page: Math.max(maxPerPage, unreadCount.value),
        page: 1
      })

      const allUnreadIds = allUnreadResponse.data.data.map(n => n.id)

      if (allUnreadIds.length === 0) {
        loading.value = false
        return
      }

      if (allUnreadResponse.data.last_page > 1) {
        for (let page = 2; page <= allUnreadResponse.data.last_page; page++) {
          const pageResponse = await NotificationService.getNotifications({
            no_leidas: true,
            per_page: maxPerPage,
            page: page
          })
          allUnreadIds.push(...pageResponse.data.data.map(n => n.id))
        }
      }

      await NotificationService.markMultipleAsRead(allUnreadIds)

      notifications.value.forEach(notification => {
        if (!notification.estado_usuario.leida) {
          notification.estado_usuario.leida = true
          notification.estado_usuario.fecha_lectura = new Date().toISOString()
        }
      })

      readCount.value = readCount.value + unreadCount.value
      unreadCount.value = 0
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

  const getTypeColor = (tipo: Notification['tipo']) =>
    NotificationService.getTypeColor(tipo)

  const getTypeIcon = (tipo: Notification['tipo']) =>
    NotificationService.getTypeIcon(tipo)

  const formatDate = (dateString: string) =>
    NotificationService.formatDate(dateString)

  const toLegacyFormat = (notification: Notification): LegacyNotification =>
    NotificationService.toLegacyFormat(notification)

  const legacyNotifications = computed(() =>
    notifications.value.map(toLegacyFormat)
  )

  const initialize = async () => {
    await Promise.all([
      fetchNotifications(),
      fetchUnreadCount()
    ])
  }

  return {
    notifications: readonly(notifications),
    loading: readonly(loading),
    error: readonly(error),
    unreadCount: readonly(unreadCount),
    totalCount: readonly(totalCount),
    readCount: readonly(readCount),
    currentPage,
    totalPages: readonly(totalPages),
    totalItems: readonly(totalItems),
    itemsPerPage: readonly(itemsPerPage),
    hasNotifications,
    hasUnreadNotifications,
    unreadNotifications,
    readNotifications,
    legacyNotifications,
    fetchNotifications,
    fetchUnreadCount,
    setUnreadCount,
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
