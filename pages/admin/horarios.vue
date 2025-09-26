<template>
  <div class="py-6">
    <PageHeader 
      title="Administración de Horarios" 
      subtitle="Gestiona los horarios disponibles para las citas de recogida"
      :show-back-button="false"
    />
    
    <div class="mt-6">
      <HorariosAdmin />
    </div>
  </div>
</template>

<script setup lang="ts">
// Meta tags para la página
definePageMeta({
  title: 'Administración de Horarios',
  description: 'Gestiona los horarios disponibles para las citas de recogida'
})


</script>
