<template>
  <div style="overflow-x: hidden;overflow-y: auto;">
    <NuxtLoadingIndicator color="#ea580c" :height="3" />
    <NuxtLayout>
      <UApp>
        <NuxtPage :keepalive="keepAliveConfig" />
      </UApp>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
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
