<template>
  <ExcelConfirmacionGuardadoView
    base-path="/cargaconsolidada/documentacion/abiertos"
    back-base-path="/cargaconsolidada/documentacion/abiertos"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const ExcelConfirmacionGuardadoView = createLazyView(
  () => import('~/components/cargaconsolidada/clientes/ExcelConfirmacionGuardadoView/index.vue')
)
</script>
