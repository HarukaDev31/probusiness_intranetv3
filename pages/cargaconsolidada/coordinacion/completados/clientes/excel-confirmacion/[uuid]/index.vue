<template>
  <ExcelConfirmacionView
    base-path="/cargaconsolidada/coordinacion/completados"
    back-base-path="/cargaconsolidada/coordinacion/completados"
  />
</template>

<script setup lang="ts">
import { createLazyView } from '~/utils/lazyView'

const ExcelConfirmacionView = createLazyView(
  () => import('~/components/cargaconsolidada/clientes/ExcelConfirmacionView/index.vue')
)
</script>
