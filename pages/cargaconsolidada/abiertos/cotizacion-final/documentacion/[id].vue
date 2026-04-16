<template>
  <ClienteDocumentacionView
    :cliente-id="clienteId"
    :return-url="returnUrl"
    title="Documentación de cliente"
    subtitle="Consulta de Documentación China e Inspección"
    :show-documentacion-peru="false"
    :show-documentacion-china="true"
    :show-inspeccion="true"
    :show-top-save-button="false"
    :show-clipboard-buttons="false"
    :read-only="true"
    :force-show-china-inspection="true"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ClienteDocumentacionView from '~/components/cargaconsolidada/documentacion/ClienteDocumentacionView.vue'

const route = useRoute()
const clienteId = Number(route.params.id)

const returnUrl = computed(() => {
  const value = route.query.returnUrl
  if (typeof value === 'string' && value.trim().length > 0) return value
  return '/cargaconsolidada/abiertos/cotizacion-final'
})
</script>
