<template>
  <div class="md:py-6">
    <PageHeader 
      :title="`Configuración de Horarios - Contenedor #${carga}`"
      subtitle="Gestiona los horarios disponibles para las citas de recogida"
      icon="mdi-calendar-clock"
      :hide-back-button="false"
      @back="navigateTo(`/cargaconsolidada/documentacion/completados/entrega/${id}`)"
    />
    
    <div class="mt-6">
      <HorariosAdmin />
    </div>
  </div>
</template>

<script setup lang="ts">
import HorariosAdmin from '~/components/admin/HorariosAdmin.vue'
import PageHeader from '~/components/PageHeader.vue'
import { useUserRole } from '~/composables/auth/useUserRole'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useRoute } from 'vue-router'
import { useEntrega } from '~/composables/cargaconsolidada/entrega/useEntrega'


// Parámetros de la ruta
const route = useRoute()
const id = route.params.id as string
const { currentRole, currentId } = useUserRole()
const { showConfirmation, showSuccess, showError } = useModal()
const { withSpinner } = useSpinner()

const { carga, getHeaders } = useEntrega();

// Meta tags para la página
definePageMeta({
  title: 'Configuración de Horarios',
  description: 'Gestiona los horarios disponibles para las citas de recogida'
})

//obtener la carga de los getHeaders
onMounted(async () => {
  await withSpinner(() => getHeaders(Number(id)))
})

// Layout

</script>
