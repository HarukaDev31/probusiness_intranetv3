<template>
  <div
    v-if="visible"
    class="fixed bottom-4 left-1/2 z-[60] w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-primary/25 bg-white p-4 shadow-lg dark:border-primary/30 dark:bg-gray-900"
    role="status"
  >
    <p class="text-sm font-medium text-highlighted">Avisos de WhatsApp Inbox</p>
    <p class="mt-1 text-xs text-muted">
      Activa las notificaciones del navegador para recibir mensajes aunque estés en otra pestaña o app.
    </p>
    <div class="mt-3 flex flex-wrap gap-2">
      <UButton size="sm" color="primary" label="Activar" :loading="cargando" @click="activar" />
      <UButton size="sm" color="neutral" variant="ghost" label="Ahora no" @click="ocultarPorSesion" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  mostrarNotificacionPruebaWaInbox,
  permisoNotificacionNavegadorWaInbox,
  registrarServiceWorkerNotificacionesWaInbox,
  solicitarPermisoNotificacionNavegadorWaInbox,
  waInboxNotificacionNavegadorSoportada
} from '~/utils/waInboxBrowserNotification'
import { precalentarSonidoWaInbox } from '~/utils/waInboxNotificationSound'

const SESSION_KEY = 'wa_inbox_notif_bar_oculta'

const route = useRoute()
const permiso = ref(permisoNotificacionNavegadorWaInbox())
const ocultaSesion = ref(false)
const cargando = ref(false)

const enWaInbox = computed(() => route.path.startsWith('/coordinacion/whatsapp-inbox'))

const visible = computed(
  () =>
    enWaInbox.value &&
    !ocultaSesion.value &&
    waInboxNotificacionNavegadorSoportada() &&
    permiso.value === 'default' &&
    Boolean(localStorage.getItem('auth_token'))
)

function ocultarPorSesion() {
  ocultaSesion.value = true
  sessionStorage.setItem(SESSION_KEY, '1')
}

async function activar() {
  cargando.value = true
  try {
    const p = await solicitarPermisoNotificacionNavegadorWaInbox()
    permiso.value = p === 'unsupported' ? 'denied' : p
    if (p === 'granted') {
      await registrarServiceWorkerNotificacionesWaInbox()
      precalentarSonidoWaInbox()
      await mostrarNotificacionPruebaWaInbox()
      ocultarPorSesion()
    }
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  ocultaSesion.value = sessionStorage.getItem(SESSION_KEY) === '1'
  void registrarServiceWorkerNotificacionesWaInbox()
})

watch(
  () => route.path,
  () => {
    permiso.value = permisoNotificacionNavegadorWaInbox()
  }
)
</script>
