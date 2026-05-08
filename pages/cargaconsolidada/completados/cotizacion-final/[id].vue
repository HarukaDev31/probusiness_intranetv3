<template>
  <CotizacionFinalView
    :role="currentRole || undefined"
    base-path="/cargaconsolidada/completados"
    back-base-path="/cargaconsolidada/completados"
  />
</template>

<script setup lang="ts">
import CotizacionFinalView from '~/components/cargaconsolidada/cotizacion-final/CotizacionFinalView/index.vue'
import { useUserRole } from '~/composables/auth/useUserRole'

const { currentRole } = useUserRole()
</script>
