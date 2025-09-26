<template>
  <div class="py-6">
    <PageHeader 
      :title="`Configuración de Horarios - Contenedor #${id}`"
      subtitle="Gestiona los horarios disponibles para las citas de recogida"
      :show-back-button="true"
      :previous-page-url="`/cargaconsolidada/completados/entrega/${id}`"
    />
    
    <div class="mt-6">
      <HorariosAdmin />
    </div>
  </div>
</template>

<script setup lang="ts">
import HorariosAdmin from '~/components/admin/HorariosAdmin.vue'
// Parámetros de la ruta
const route = useRoute()
const id = route.params.id as string

// Meta tags para la página
definePageMeta({
  title: 'Configuración de Horarios',
  description: 'Gestiona los horarios disponibles para las citas de recogida'
})

// Layout

</script>
