<template>
  <div
    v-if="visible"
    class="fixed bottom-4 left-1/2 z-[60] w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-primary/25 bg-white p-4 shadow-lg dark:border-primary/30 dark:bg-gray-900"
    role="status"
  >
    <p class="text-sm font-medium text-highlighted">Avisos de chat en Windows</p>
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
  permisoNotificacionNavegador,
  mostrarNotificacionPruebaSoporteTi,
  registrarServiceWorkerNotificaciones,
  solicitarPermisoNotificacionNavegador,
  soporteTiNotificacionNavegadorSoportada
} from '~/utils/soporteTiBrowserNotification'

const SESSION_KEY = 'soporte_ti_notif_bar_oculta'

const route = useRoute()
const permiso = ref(permisoNotificacionNavegador())
const ocultaSesion = ref(false)
const cargando = ref(false)

const enSoporteTi = computed(() => route.path.startsWith('/soporte-ti'))

const visible = computed(
  () =>
    enSoporteTi.value &&
    !ocultaSesion.value &&
    soporteTiNotificacionNavegadorSoportada() &&
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
    const p = await solicitarPermisoNotificacionNavegador()
    permiso.value = p === 'unsupported' ? 'denied' : p
    if (p === 'granted') {
      await registrarServiceWorkerNotificaciones()
      await mostrarNotificacionPruebaSoporteTi()
      ocultarPorSesion()
    }
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  ocultaSesion.value = sessionStorage.getItem(SESSION_KEY) === '1'
  void registrarServiceWorkerNotificaciones()
})

watch(
  () => route.path,
  () => {
    permiso.value = permisoNotificacionNavegador()
  }
)
</script>
