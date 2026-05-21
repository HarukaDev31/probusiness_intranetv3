<template>
  <UModal v-model:open="isOpen" class="sm:max-w-2xl" @update:open="onModalOpenChange">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-users" class="w-5 h-5 text-primary-500" />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Detalle de generación
        </h3>
      </div>
      <p v-if="resumen" class="text-sm text-gray-500 mt-1">{{ resumen }}</p>
    </template>

    <template #body>
      <div class="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
        <section>
          <div class="flex items-center gap-2 mb-3">
            <UBadge color="success" variant="soft" size="sm">
              {{ exitosos.length }} exitoso{{ exitosos.length === 1 ? '' : 's' }}
            </UBadge>
          </div>
          <ul v-if="exitosos.length" class="space-y-2">
            <li
              v-for="(item, index) in exitosos"
              :key="`ok-${index}-${item.nombre}`"
              class="rounded-lg border border-green-200 dark:border-green-800/50 bg-green-50/50 dark:bg-green-900/10 px-3 py-2 text-sm"
            >
              <p class="font-medium text-gray-900 dark:text-white">{{ item.nombre }}</p>
              <p v-if="item.id_cotizacion" class="text-xs text-gray-500 mt-0.5">
                Cotización #{{ item.id_cotizacion }}
              </p>
              <p v-if="item.archivo" class="text-xs text-gray-500 truncate" :title="item.archivo">
                {{ item.archivo }}
              </p>
            </li>
          </ul>
          <p v-else class="text-sm text-gray-400">Ningún cliente procesado con éxito.</p>
        </section>

        <section>
          <div class="flex items-center gap-2 mb-3">
            <UBadge color="error" variant="soft" size="sm">
              {{ fallidos.length }} con error{{ fallidos.length === 1 ? '' : 'es' }}
            </UBadge>
          </div>
          <ul v-if="fallidos.length" class="space-y-2">
            <li
              v-for="(item, index) in fallidos"
              :key="`err-${index}-${item.nombre}`"
              class="rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10 px-3 py-2 text-sm"
            >
              <p class="font-medium text-gray-900 dark:text-white">{{ item.nombre }}</p>
              <p class="text-xs text-red-600 dark:text-red-400 mt-0.5">{{ item.motivo }}</p>
            </li>
          </ul>
          <p v-else class="text-sm text-gray-400">Ningún cliente con error.</p>
        </section>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end">
        <UButton color="neutral" variant="outline" label="Cerrar" @click="close" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PlantillasFinalesDetalleModalProps } from './types'
import type { PlantillaFinalBatchDetalleJson } from '~/types/cargaconsolidada/cotizacion-final/plantilla-final-batch'

const props = defineProps<PlantillasFinalesDetalleModalProps>()

const isOpen = defineModel<boolean>('open', { default: false })

const emptyDetalle = (): PlantillaFinalBatchDetalleJson => ({
  exitosos: [],
  fallidos: []
})

const detalleNormalizado = computed(() => props.detalle ?? emptyDetalle())
const exitosos = computed(() => detalleNormalizado.value.exitosos ?? [])
const fallidos = computed(() => detalleNormalizado.value.fallidos ?? [])

const close = () => {
  isOpen.value = false
}

const onModalOpenChange = (open: boolean) => {
  if (!open) close()
}
</script>
