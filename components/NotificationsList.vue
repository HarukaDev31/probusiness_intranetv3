<template>
  <div class="notifications-container">
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-3">
        <UIcon name="i-heroicons-paper-airplane" class="text-2xl text-primary" />
        <h1 class="text-2xl font-bold text-gray-900">Notificaciones</h1>
      </div>
      <div class="flex items-center gap-3">
        <UButton
          color="gray"
          variant="outline"
          @click="markAllAsRead"
          :disabled="unreadCount === 0"
        >
          Marcar todas como leídas
        </UButton>
        <UDropdown :items="filterItems" :popper="{ placement: 'bottom-end' }">
          <UButton color="gray" variant="outline" trailing-icon="i-heroicons-chevron-down">
            {{ currentFilter }}
          </UButton>
        </UDropdown>
      </div>
    </div>

    <!-- Summary Section -->
    <div class="bg-gray-50 rounded-lg p-4 mb-6">
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <p class="text-sm text-gray-600">Total Notificaciones</p>
          <p class="text-2xl font-bold text-gray-900">{{ totalNotifications }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">Sin leer</p>
          <p class="text-2xl font-bold text-red-600">{{ unreadCount }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">Leídas</p>
          <p class="text-2xl font-bold text-green-600">{{ readCount }}</p>
        </div>
      </div>
    </div>

    <!-- Notifications List -->
    <div class="space-y-4">
      <div
        v-for="notification in filteredNotifications"
        :key="notification.id"
        class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-3 flex-1">
            <!-- Status Indicator -->
            <div
              class="w-3 h-3 rounded-full mt-1 flex-shrink-0"
              :class="getStatusColor(notification.status)"
            />
            
            <!-- Notification Content -->
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 mb-1">
                {{ notification.title }}
              </h3>
              <p class="text-gray-600 text-sm mb-2">
                {{ notification.description }}
              </p>
              
              <!-- Footer Info -->
              <div class="flex items-center gap-4 text-xs text-gray-500">
                <span>{{ formatTimeAgo(notification.createdAt) }}</span>
                <UBadge
                  :color="getCategoryColor(notification.category)"
                  variant="soft"
                  size="xs"
                >
                  {{ notification.category }}
                </UBadge>
              </div>
            </div>
          </div>
          
          <!-- Delete Button -->
          <UButton
            icon="i-heroicons-trash"
            color="red"
            variant="ghost"
            size="sm"
            @click="deleteNotification(notification.id)"
            class="flex-shrink-0"
          />
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="filteredNotifications.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-bell-slash" class="text-6xl text-gray-300 mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">No hay notificaciones</h3>
        <p class="text-gray-500">No se encontraron notificaciones con el filtro seleccionado.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Notification {
  id: string
  title: string
  description: string
  status: 'unread' | 'read'
  category: 'Cliente' | 'Carga' | 'Aduanas' | 'Sistema'
  createdAt: Date
}

interface Props {
  notifications?: Notification[]
}

const props = withDefaults(defineProps<Props>(), {
  notifications: () => []
})

const emit = defineEmits<{
  markAllAsRead: []
  deleteNotification: [id: string]
}>()

// Reactive data
const currentFilter = ref('Todas')
const filterItems = [
  [{ label: 'Todas', click: () => setFilter('Todas') }],
  [{ label: 'Sin leer', click: () => setFilter('Sin leer') }],
  [{ label: 'Leídas', click: () => setFilter('Leídas') }],
  [{ label: 'Cliente', click: () => setFilter('Cliente') }],
  [{ label: 'Carga', click: () => setFilter('Carga') }],
  [{ label: 'Aduanas', click: () => setFilter('Aduanas') }],
  [{ label: 'Sistema', click: () => setFilter('Sistema') }]
]

// Computed properties
const totalNotifications = computed(() => props.notifications.length)
const unreadCount = computed(() => props.notifications.filter(n => n.status === 'unread').length)
const readCount = computed(() => props.notifications.filter(n => n.status === 'read').length)

const filteredNotifications = computed(() => {
  if (currentFilter.value === 'Todas') {
    return props.notifications
  } else if (currentFilter.value === 'Sin leer') {
    return props.notifications.filter(n => n.status === 'unread')
  } else if (currentFilter.value === 'Leídas') {
    return props.notifications.filter(n => n.status === 'read')
  } else {
    return props.notifications.filter(n => n.category === currentFilter.value)
  }
})

// Methods
const setFilter = (filter: string) => {
  currentFilter.value = filter
}

const markAllAsRead = () => {
  emit('markAllAsRead')
}

const deleteNotification = (id: string) => {
  emit('deleteNotification', id)
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'unread':
      return 'bg-blue-500'
    case 'read':
      return 'bg-gray-400'
    default:
      return 'bg-gray-400'
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Cliente':
      return 'blue'
    case 'Carga':
      return 'green'
    case 'Aduanas':
      return 'yellow'
    case 'Sistema':
      return 'purple'
    default:
      return 'gray'
  }
}

const formatTimeAgo = (date: Date) => {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) {
    return 'Hoy'
  } else if (diffInDays === 1) {
    return 'Ayer'
  } else {
    return `Hace ${diffInDays} días`
  }
}
</script>

<style scoped>
.notifications-container {
  max-width: 4xl;
  margin: 0 auto;
  padding: 1rem;
}
</style>
