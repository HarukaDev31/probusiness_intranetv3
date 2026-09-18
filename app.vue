<template>
  <div
    class="min-h-0"
    :class="lockAppViewport ? 'h-dvh max-h-dvh overflow-hidden' : ''"
    style="overflow-x: hidden;"
  >
    <NuxtLoadingIndicator color="#ea580c" :height="3" />
    <NuxtLayout>
      <UApp class="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        <NuxtPage :keepalive="keepAliveConfig" />
      </UApp>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

/** Misma regla que el layout: inbox/calendario no pueden quedar en un padre con overflow-y auto. */
const lockAppViewport = computed(() =>
  route.path.startsWith('/calendar')
  || route.path.startsWith('/coordinacion/whatsapp-inbox')
  || (route.path.startsWith('/soporte-ti') && !route.path.includes('/configuracion'))
  || (route.path.startsWith('/manual-usuario') && !route.path.startsWith('/manual-usuario/admin'))
)

/** Rutas de listado frecuentes: evita remount al volver desde un detalle. */
const keepAliveConfig = {
  include: [
    'cargaconsolidada-abiertos',
    'cargaconsolidada-completados',
    'cargaconsolidada-coordinacion-abiertos',
    'cargaconsolidada-coordinacion-completados',
    'cargaconsolidada-documentacion-abiertos',
    'cargaconsolidada-documentacion-completados',
    'viaticos-pendientes',
    'viaticos-completados',
    'copiloto-index',
    'copiloto-equipo-index',
  ],
}
</script>
