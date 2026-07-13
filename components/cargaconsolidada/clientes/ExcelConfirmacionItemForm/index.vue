<script setup lang="ts">
import {
  calcItemTotal,
  formatUsd,
  type IntranetItemFormState
} from '~/utils/cargaconsolidada/excelConfirmacion'

const props = defineProps<{
  item: IntranetItemFormState
  labels: string[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:item': [IntranetItemFormState]
}>()

const FOTO_MIN_HEIGHT = 'min-h-44'

const localItem = computed({
  get: () => props.item,
  set: (value) => emit('update:item', value)
})

const total = computed(() => calcItemTotal(localItem.value))
const formattedTotal = computed(() => formatUsd(total.value))
const cleanLabel = (label: string) => label.replace(/:$/, '').trim()

const caracteristicasFilled = computed(() =>
  props.labels.filter((label) => String(localItem.value.caracteristicas[label] || '').trim()).length
)

const updateField = <K extends keyof IntranetItemFormState>(key: K, value: IntranetItemFormState[K]) => {
  if (props.readonly) return
  localItem.value = { ...localItem.value, [key]: value }
}

const updateCaracteristica = (label: string, value: string) => {
  if (props.readonly) return
  localItem.value = {
    ...localItem.value,
    caracteristicas: { ...localItem.value.caracteristicas, [label]: value }
  }
}

const hasFoto = computed(() => String(localItem.value.foto_url || '').trim() !== '')
const caracteristicasOpen = ref(false)
</script>

<template>
  <div class="divide-y divide-gray-200 dark:divide-gray-700">
    <section class="p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:items-stretch">
        <div class="w-full h-full flex flex-col" :class="FOTO_MIN_HEIGHT">
          <div
            v-if="hasFoto"
            class="relative w-full h-full flex-1 flex items-center justify-center rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
            :class="FOTO_MIN_HEIGHT"
          >
            <img
              :src="localItem.foto_url"
              alt="Producto"
              class="max-w-full max-h-full w-auto h-auto object-contain"
            >
          </div>
          <div
            v-else
            class="w-full h-full flex-1 flex items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500"
            :class="FOTO_MIN_HEIGHT"
          >
            Sin foto
          </div>
          <UFormField label="URL foto / imagen" class="mt-3 w-full">
            <UInput
              class="w-full"
              :disabled="readonly"
              :model-value="localItem.foto_url"
              placeholder="https://..."
              @update:model-value="updateField('foto_url', $event)"
            />
          </UFormField>
        </div>

        <div class="min-w-0 grid grid-cols-2 gap-x-3 gap-y-3">
          <UFormField label="Nombre comercial" required class="col-span-2 w-full">
            <UInput
              class="w-full"
              :disabled="readonly"
              :model-value="localItem.nombre_comercial"
              placeholder="Nombre del producto"
              @update:model-value="updateField('nombre_comercial', $event)"
            />
          </UFormField>

          <UFormField label="HS Code" class="w-full min-w-0">
            <UInput
              class="w-full"
              :disabled="readonly"
              :model-value="localItem.hs_code"
              placeholder="6403.99.00"
              @update:model-value="updateField('hs_code', $event)"
            />
          </UFormField>

          <UFormField label="Link del producto" class="w-full min-w-0">
            <UInput
              class="w-full"
              :disabled="readonly"
              :model-value="localItem.link_producto"
              type="url"
              placeholder="https://..."
              @update:model-value="updateField('link_producto', $event)"
            />
          </UFormField>

          <UFormField label="Cantidad" required class="w-full min-w-0">
            <UInput
              v-model.number="localItem.qty"
              class="w-full"
              :disabled="readonly"
              type="number"
              min="0"
              step="1"
            />
          </UFormField>

          <UFormField label="Precio EXW" required class="w-full min-w-0">
            <UInput
              v-model.number="localItem.precio_unitario"
              class="w-full"
              :disabled="readonly"
              type="number"
              min="0"
              step="0.01"
            />
          </UFormField>

          <UFormField label="Total USD" class="col-span-2 w-full">
            <div
              class="w-full h-9 flex items-center justify-end px-3 rounded-md border text-sm font-semibold"
              :class="total > 0
                ? 'border-primary-200 text-primary-700 dark:border-primary-800 dark:text-primary-300'
                : 'border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-500'"
            >
              ${{ formattedTotal }}
            </div>
          </UFormField>
        </div>
      </div>
    </section>

    <section v-if="labels.length" class="px-4 pb-4">
      <UCollapsible v-model:open="caracteristicasOpen" :unmount-on-hide="false">
        <button
          type="button"
          class="flex w-full items-center gap-2.5 py-2.5 text-left"
        >
          <UIcon name="i-heroicons-adjustments-horizontal" class="size-4 text-primary-600 shrink-0" />
          <div class="min-w-0 flex-1 flex items-center gap-2">
            <h3 class="text-sm font-medium text-gray-900 dark:text-white">Características</h3>
            <UBadge color="neutral" variant="subtle" size="xs">
              {{ caracteristicasFilled }}/{{ labels.length }}
            </UBadge>
          </div>
          <UIcon
            name="i-heroicons-chevron-down"
            class="size-4 text-gray-400 shrink-0 transition-transform duration-200"
            :class="{ 'rotate-180': caracteristicasOpen }"
          />
        </button>
        <template #content>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pb-2">
            <UFormField
              v-for="label in labels"
              :key="label"
              :label="cleanLabel(label)"
              class="w-full min-w-0"
            >
              <UInput
                class="w-full"
                :disabled="readonly"
                :model-value="localItem.caracteristicas[label] || ''"
                placeholder="—"
                size="sm"
                @update:model-value="updateCaracteristica(label, $event)"
              />
            </UFormField>
          </div>
        </template>
      </UCollapsible>
    </section>
  </div>
</template>
