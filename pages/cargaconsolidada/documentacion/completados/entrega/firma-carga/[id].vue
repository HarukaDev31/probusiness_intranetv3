<template>
  <CargoEntregaFirmaCargaView
    :back-url="backUrl"
    :id-cotizacion="idCotizacion"
    :id-contenedor="idContenedor"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const CargoEntregaFirmaCargaView = defineAsyncComponent(
  () => import('~/components/cargaconsolidada/entrega/CargoEntregaFirmaCargaView/index.vue')
)

const route = useRoute()
const idCotizacion = Number(route.params.id)
const idContenedor = Number(route.query.id_contenedor)
const backUrl = computed(() => `/cargaconsolidada/documentacion/completados/entrega/${idContenedor}`)
</script>
