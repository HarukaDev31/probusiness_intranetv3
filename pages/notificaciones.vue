<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Notificaciones</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        Gestiona tus notificaciones del sistema
      </p>
    </div>

    <!-- Loading State -->
    <template v-if="loading">
      <!-- Stats Skeleton -->
      <NotificationStatsSkeleton class="mb-6" />
      
      <!-- Actions Skeleton -->
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <div class="h-10 bg-gray-300 dark:bg-gray-600 rounded w-48 animate-pulse"></div>
        <div class="h-10 bg-gray-300 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
      </div>
      
      <!-- Notifications Skeleton -->
      <NotificationSkeleton :count="5" />
    </template>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <div class="flex items-center">
        <UIcon name="i-heroicons-exclamation-triangle" class="text-red-500 w-5 h-5 mr-2" />
        <span class="text-red-800 dark:text-red-200">{{ error }}</span>
      </div>
      <UButton 
        variant="outline" 
        color="error" 
        size="sm" 
        class="mt-3"
        @click="initialize"
      >
        Reintentar
      </UButton>
    </div>

    <!-- Stats -->
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div 
        @click="applyFilter('all')"
        class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
        :class="{ 'ring-2 ring-blue-500': currentFilter === 'all' }"
      >
        <div class="flex items-center">
          <UIcon name="i-heroicons-bell" class="text-blue-500 w-6 h-6 mr-3" />
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Total</p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">{{ totalCount }}</p>
          </div>
        </div>
      </div>
      
      <div 
        @click="applyFilter('unread')"
        class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
        :class="{ 'ring-2 ring-orange-500': currentFilter === 'unread' }"
      >
        <div class="flex items-center">
          <UIcon name="i-heroicons-exclamation-circle" class="text-orange-500 w-6 h-6 mr-3" />
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">No leídas</p>
            <p class="text-xl font-semibold text-orange-600 dark:text-orange-400">{{ unreadCount }}</p>
          </div>
        </div>
      </div>
      
      <div 
        @click="applyFilter('read')"
        class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
        :class="{ 'ring-2 ring-green-500': currentFilter === 'read' }"
      >
        <div class="flex items-center">
          <UIcon name="i-heroicons-check-circle" class="text-green-500 w-6 h-6 mr-3" />
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Leídas</p>
            <p class="text-xl font-semibold text-green-600 dark:text-green-400">{{ readCount }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions Bar -->
    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <UButton 
        v-if="hasUnreadNotifications"
        icon="i-heroicons-check-badge"
        @click="handleMarkAllAsRead"
        :disabled="loading"
      >
        Marcar todas como leídas
      </UButton>
      
      <UButton 
        variant="outline"
        icon="i-heroicons-arrow-path"
        @click="() => fetchNotifications()"
        :disabled="loading"
      >
        Actualizar
      </UButton>
    </div>

    <!-- Notifications List -->
    <div v-if="hasNotifications" class="space-y-4">
      <div 
        v-for="notification in notifications" 
        :key="notification.id"
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-sm transition-shadow"
        :class="{ 
          'border-l-4 border-l-blue-500': !notification.estado_usuario.leida,
          'opacity-75': navigatingToId === notification.id
        }"
      >
        <div class="flex items-start justify-between">
          <!-- Área de contenido (sin navegación) -->
          <div 
            class="flex-1 relative"
          >
            <!-- Loading overlay cuando está navegando -->
            <div 
              v-if="navigatingToId === notification.id"
              class="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded flex items-center justify-center z-10"
            >
              <div class="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <div class="w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                Navegando...
              </div>
            </div>

            <div class="flex items-center gap-2 mb-2">
              <UIcon 
                :name="notification.icono || getTypeIcon(notification.tipo)" 
                :class="[
                  'w-5 h-5',
                  `text-${getTypeColor(notification.tipo)}-500`
                ]"
              />
              <h3 class="font-semibold text-gray-900 dark:text-white">
                {{ notification.titulo }}
              </h3>
              <UBadge 
                v-if="!notification.estado_usuario.leida"
                color="primary"
                variant="soft"
                size="xs"
              >
                Nuevo
              </UBadge>
            </div>
            
            <p class="text-gray-600 dark:text-gray-400 mb-2">
              {{ notification.mensaje }}
            </p>
            
            <div v-if="notification.descripcion" class="text-sm text-gray-500 dark:text-gray-500 mb-2">
              {{ notification.descripcion }}
            </div>
            
            <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>{{ notification.modulo }}</span>
              <span>{{ formatDateTimeToDmy(notification.fecha_creacion) }}</span>
              <span>{{ notification.creador.nombre }}</span>
              
              <!-- Mostrar parámetros de navegación si existen -->
              <span v-if="notification.navigate_to" class="text-blue-500">
                <UIcon name="i-heroicons-link" class="w-3 h-3 inline mr-1" />
                {{ getNavigationPreview(notification) }}
              </span>
            </div>
          </div>
          
          <div class="flex items-center gap-2 ml-4">
            <!-- Botón de navegación: marca como leída Y navega -->
            <UButton
              v-if="notification.navigate_to"
              variant="ghost"
              size="sm"
              color="info"
              icon="i-heroicons-arrow-top-right-on-square"
              @click.stop="handleNotificationClick(notification)"
              title="Marcar como leída y navegar"
              :disabled="navigatingToId === notification.id"
              :loading="navigatingToId === notification.id"
            />
            
            <!-- Botón de check: solo marca como leída -->
            <UButton
              v-if="!notification.estado_usuario.leida"
              variant="ghost"
              size="sm"
              icon="i-heroicons-check"
              color="success"
              @click.stop="markAsRead(notification.id)"
              title="Marcar como leída (sin navegar)"
              :disabled="navigatingToId === notification.id"
            />
            
            <!-- Botón de eliminar -->
            <UButton
              variant="ghost"
              size="sm"
              color="error"
              icon="i-heroicons-trash"
              @click.stop="handleDeleteNotification(notification.id)"
              title="Eliminar notificación"
              :disabled="navigatingToId === notification.id"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading" class="text-center py-12">
      <UIcon name="i-heroicons-bell-slash" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No hay notificaciones
      </h3>
      <p class="text-gray-600 dark:text-gray-400">
        Cuando recibas notificaciones, aparecerán aquí.
      </p>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-8 flex justify-center">
      <UPagination
        :model-value="currentPage"
        :total="totalItems"
        :items-per-page="itemsPerPage"
        show-first
        show-last
        @update:page="changePage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Notification, LegacyNotification } from '~/types/notification'
import { NotificationService } from '~/services/notificationService'

// Meta
definePageMeta({
  title: 'Notificaciones',
  layout: 'default'
})

// Router y route
const route = useRoute()
const router = useRouter()

// Estado local para navegación
const navigatingToId = ref<number | null>(null)

// Estado del filtro actual
const currentFilter = ref<'all' | 'unread' | 'read'>('unread')

// Composable
const {
  notifications,
  loading,
  error,
  unreadCount,
  totalCount,
  readCount,
  totalItems,
  totalPages,
  currentPage,
  itemsPerPage,
  hasNotifications,
  hasUnreadNotifications,
  readNotifications,
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  handleNotificationClick: originalHandleNotificationClick,
  deleteNotification,
  changePage,
  getTypeColor,
  getTypeIcon,
  formatDate,
  initialize
} = useNotifications()

// Methods
const handleMarkAllAsRead = async () => {
  try {
    await markAllAsRead()
  } catch (error) {
    console.error('Error al marcar todas como leídas:', error)
  }
}

const handleDeleteNotification = async (id: number) => {
  try {
    await deleteNotification(id)
  } catch (error) {
    console.error('Error al eliminar notificación:', error)
  }
}

const handleNotificationClick = async (notification: Notification) => {
  try {
    navigatingToId.value = notification.id
    // Solo navegar, sin marcar como leída
    NotificationService.navigateToNotification(notification)
  } catch (error) {
    console.error('Error al procesar notificación:', error)
  } finally {
    // Limpiar el estado después de un breve delay para mostrar el feedback
    setTimeout(() => {
      navigatingToId.value = null
    }, 500)
  }
}


const getNavigationPreview = (notification: Notification): string => {
  if (!notification.navigate_params) return notification.navigate_to || ''
  
  try {
    let params: Record<string, any> = {}
    
    if (typeof notification.navigate_params === 'string') {
      params = JSON.parse(notification.navigate_params)
    } else {
      params = notification.navigate_params
    }
    
    // Construir vista previa de la URL final
    let previewUrl = notification.navigate_to || ''
    
    // Agregar idContenedor como parámetro de ruta
    if (params.idContenedor) {
      previewUrl += `/${params.idContenedor}`
    }
    
    // Agregar query params
    const queryParams: string[] = []
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'idContenedor' && value !== null && value !== undefined) {
        queryParams.push(`${key}=${value}`)
      }
    })
    
    if (queryParams.length > 0) {
      previewUrl += `?${queryParams.join('&')}`
    }
    
    // Mostrar solo la parte relevante de la URL para no sobrecargar la vista
    const urlParts = previewUrl.split('/')
    const relevantParts = urlParts.slice(-2) // Últimas 2 partes + query params
    
    return relevantParts.join('/') || 'Ver detalles'
  } catch (error) {
    return 'Ver detalles'
  }
}

// Aplicar filtro desde los cards
const applyFilter = async (filter: 'all' | 'unread' | 'read') => {
  currentFilter.value = filter
  
  // Actualizar query params en la URL
  const query: Record<string, any> = { ...route.query }
  
  if (filter === 'all') {
    // No enviar query param para "Total"
    delete query.no_leidas
  } else if (filter === 'unread') {
    // Enviar no_leidas=true
    query.no_leidas = 'true'
  } else if (filter === 'read') {
    // Enviar no_leidas=false
    query.no_leidas = 'false'
  }
  
  // Actualizar la URL sin recargar la página
  await router.push({ query })
  
  // Aplicar el filtro a las notificaciones
  const filterParams: any = { page: 1 }
  if (filter === 'unread') {
    filterParams.no_leidas = true
  } else if (filter === 'read') {
    filterParams.no_leidas = false
  } else {
    // Si es 'all', establecer explícitamente como undefined para eliminarlo
    filterParams.no_leidas = undefined
  }
  
  // Resetear a página 1 cuando cambia el filtro
  await fetchNotifications(filterParams)
}

// Leer query params al inicializar
const initializeFilters = () => {
  const noLeidasParam = route.query.no_leidas
  
  if (noLeidasParam === 'true') {
    currentFilter.value = 'unread'
  } else if (noLeidasParam === 'false') {
    currentFilter.value = 'read'
  } else {
    currentFilter.value = 'all'
  }
}

// Lifecycle
onMounted(async () => {
  let noLeidasParam: string | undefined = route.query.no_leidas as string | undefined
  
  // Si no hay query param, establecer no_leidas=true por defecto
  if (!noLeidasParam) {
    await router.push({ query: { ...route.query, no_leidas: 'true' } })
    currentFilter.value = 'unread'
    noLeidasParam = 'true'
  } else {
    // Inicializar filtros desde query params existentes
    initializeFilters()
  }
  
  // Cargar notificaciones con el filtro inicial
  const initialFilters: any = {}
  
  if (noLeidasParam === 'true') {
    initialFilters.no_leidas = true
  } else if (noLeidasParam === 'false') {
    initialFilters.no_leidas = false
  }
  // Si no hay param o es 'all', no agregamos no_leidas
  
  await fetchNotifications(initialFilters)
  // fetchUnreadCount ya no es necesario, los conteos vienen en fetchNotifications
})
</script>
