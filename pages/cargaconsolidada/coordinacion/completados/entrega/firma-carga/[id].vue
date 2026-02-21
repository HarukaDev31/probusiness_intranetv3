<template>
  <CargoEntregaFirmaCargaView
    :back-url="backUrl"
    :id-cotizacion="idCotizacion"
    :id-contenedor="idContenedor"
  />
</template>

<script setup lang="ts">
import CargoEntregaFirmaCargaView from '~/components/cargaconsolidada/entrega/CargoEntregaFirmaCargaView.vue'

const route = useRoute()
const idCotizacion = Number(route.params.id)
const idContenedor = Number(route.query.id_contenedor)
const backUrl = computed(() => `/cargaconsolidada/coordinacion/completados/entrega/${idContenedor}`)
</script>
