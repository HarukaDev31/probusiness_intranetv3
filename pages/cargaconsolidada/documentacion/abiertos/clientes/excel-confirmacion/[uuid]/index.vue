<template>
  <ExcelConfirmacionView
    base-path="/cargaconsolidada/documentacion/abiertos"
    back-base-path="/cargaconsolidada/documentacion/abiertos"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const ExcelConfirmacionView = createLazyView(
  () => import('~/components/cargaconsolidada/clientes/ExcelConfirmacionView/index.vue')
)
</script>
