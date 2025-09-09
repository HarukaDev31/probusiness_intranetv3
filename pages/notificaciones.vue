<template>
  <div>
    <NotificationsList
      :notifications="notifications"
      @mark-all-as-read="handleMarkAllAsRead"
      @delete-notification="handleDeleteNotification"
    />
  </div>
</template>

<script setup lang="ts">
import type { Notification } from '~/types/notification'

// Meta
definePageMeta({
  title: 'Notificaciones',
  layout: 'default'
})

// Reactive data
const notifications = ref<Notification[]>([
  {
    id: '1',
    title: 'Nuevo cliente registrado',
    description: 'Yulietsy denire delgado cuicas se ha registrado como nuevo cliente en el sistema.',
    status: 'read',
    category: 'Cliente',
    createdAt: new Date(Date.now() - 243 * 24 * 60 * 60 * 1000) // 243 días atrás
  },
  {
    id: '2',
    title: 'Carga consolidada completada',
    description: 'La carga consolidada #CC-2025-001 ha sido procesada exitosamente y está lista para envío.',
    status: 'read',
    category: 'Carga',
    createdAt: new Date(Date.now() - 243 * 24 * 60 * 60 * 1000) // 243 días atrás
  },
  {
    id: '3',
    title: 'Documento aduanero pendiente',
    description: 'El documento aduanero para el cliente Alexander Julián Pacheco Aliaga requiere revisión.',
    status: 'read',
    category: 'Aduanas',
    createdAt: new Date(Date.now() - 244 * 24 * 60 * 60 * 1000) // 244 días atrás
  },
  {
    id: '4',
    title: 'Sistema actualizado',
    description: 'Se ha actualizado el sistema con nuevas funcionalidades de gestión de documentos.',
    status: 'unread',
    category: 'Sistema',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 día atrás
  },
  {
    id: '5',
    title: 'Nueva carga consolidada',
    description: 'Se ha creado una nueva carga consolidada #CC-2025-002 que requiere revisión.',
    status: 'unread',
    category: 'Carga',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 horas atrás
  }
])

// Methods
const handleMarkAllAsRead = () => {
  notifications.value = notifications.value.map(notification => ({
    ...notification,
    status: 'read' as const
  }))
  
  // Aquí podrías hacer una llamada a la API para marcar todas como leídas
  console.log('Marcando todas las notificaciones como leídas')
}

const handleDeleteNotification = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
    
    // Aquí podrías hacer una llamada a la API para eliminar la notificación
    console.log(`Eliminando notificación con ID: ${id}`)
  }
}

// Lifecycle
onMounted(() => {
  // Aquí podrías cargar las notificaciones desde la API
  console.log('Cargando notificaciones...')
})
</script>
