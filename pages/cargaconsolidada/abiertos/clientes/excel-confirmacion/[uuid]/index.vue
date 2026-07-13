<template>
  <ExcelConfirmacionView
    base-path="/cargaconsolidada/abiertos"
    back-base-path="/cargaconsolidada/abiertos"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const ExcelConfirmacionView = createLazyView(
  () => import('~/components/cargaconsolidada/clientes/ExcelConfirmacionView/index.vue')
)
</script>
