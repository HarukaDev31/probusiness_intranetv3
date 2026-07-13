<template>
  <ExcelConfirmacionGuardadoView
    base-path="/cargaconsolidada/coordinacion/abiertos"
    back-base-path="/cargaconsolidada/coordinacion/abiertos"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const ExcelConfirmacionGuardadoView = createLazyView(
  () => import('~/components/cargaconsolidada/clientes/ExcelConfirmacionGuardadoView/index.vue')
)
</script>
