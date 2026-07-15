<script setup lang="ts">
import {
  calcItemTotal,
  formatMoneyWhileTyping,
  formatUsd,
  parseMoneyDraft,
  roundMoney,
  type IntranetItemFormState
} from '~/utils/cargaconsolidada/excelConfirmacion'
import {
  getCaracteristicaFieldConfig,
  getRequiredCaracteristicaValues,
  selectOptions,
  visibleCaracteristicaLabels
} from '~/utils/cargaconsolidada/caracteristicaFields'

const props = defineProps<{
  item: IntranetItemFormState
  labels: string[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:item': [IntranetItemFormState]
}>()

const localItem = computed({
  get: () => props.item,
  set: (value) => emit('update:item', value)
})

const total = computed(() => calcItemTotal(localItem.value))
const formattedTotal = computed(() => formatUsd(total.value))

const isOptionalLabel = (label: string) => {
  const key = label.replace(/:$/g, '').trim().toLowerCase()
  return key === 'marca' || key === 'modelo'
}

const visibleLabels = computed(() => visibleCaracteristicaLabels(props.labels))

const caracteristicasRequiredValues = computed(() =>
  getRequiredCaracteristicaValues(
    props.labels,
    localItem.value.caracteristicas,
    isOptionalLabel
  )
)

const caracteristicasCompletas = computed(() => {
  const required = caracteristicasRequiredValues.value
  return (
    required.length === 0 ||
    required.every((value) => value !== null && value !== undefined && String(value).trim() !== '')
  )
})

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
const caracteristicasOpen = ref(true)

const precioFocused = ref(false)
const precioDraft = ref('')

const precioDisplay = computed(() => {
  if (precioFocused.value) return precioDraft.value
  const value = localItem.value.precio_unitario
  if (value === null || value === undefined || Number.isNaN(Number(value))) return ''
  return formatUsd(Number(value))
})

const onPrecioFocus = () => {
  if (props.readonly) return
  precioFocused.value = true
  const value = localItem.value.precio_unitario
  precioDraft.value =
    value === null || value === undefined || Number.isNaN(Number(value))
      ? ''
      : formatMoneyWhileTyping(value)
}

const onPrecioInput = (raw: string | number) => {
  if (props.readonly) return
  const formatted = formatMoneyWhileTyping(raw)
  precioDraft.value = formatted
  updateField('precio_unitario', parseMoneyDraft(formatted))
}

const onPrecioBlur = () => {
  precioFocused.value = false
  const value = localItem.value.precio_unitario
  if (value !== null && value !== undefined && Number.isFinite(Number(value))) {
    updateField('precio_unitario', roundMoney(Number(value)))
  }
  precioDraft.value = ''
}
</script>

<template>
  <div class="divide-y divide-gray-200 dark:divide-gray-700">
    <section class="p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:items-start">
        <div class="w-full min-w-0">
          <div
            v-if="hasFoto"
            class="relative w-full flex items-center justify-center rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 max-h-64"
          >
            <img
              :src="localItem.foto_url"
              alt="Producto"
              class="max-w-full max-h-64 w-auto h-auto object-contain"
            >
          </div>
          <div
            v-else
            class="w-full min-h-44 max-h-64 flex items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500"
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

        <div class="min-w-0 self-start grid grid-cols-2 gap-x-3 gap-y-3 content-start">
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
              class="w-full"
              :disabled="readonly"
              :model-value="precioDisplay"
              type="text"
              inputmode="decimal"
              placeholder="0.00"
              @focus="onPrecioFocus"
              @blur="onPrecioBlur"
              @update:model-value="onPrecioInput"
            >
              <template #leading>
                <span class="text-gray-500">$</span>
              </template>
            </UInput>
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

    <section v-if="visibleLabels.length" class="px-4 pb-4">
      <UCollapsible v-model:open="caracteristicasOpen" :unmount-on-hide="false">
        <button
          type="button"
          class="flex w-full items-center gap-2.5 py-2.5 text-left"
        >
          <UIcon name="i-heroicons-adjustments-horizontal" class="size-4 text-primary-600 shrink-0" />
          <div class="min-w-0 flex-1 flex items-center gap-2">
            <h3 class="text-sm font-medium text-gray-900 dark:text-white">Características</h3>
            <UBadge
              :color="caracteristicasCompletas ? 'success' : 'warning'"
              variant="subtle"
              size="xs"
            >
              {{ caracteristicasCompletas ? 'Listo' : 'Pendiente' }}
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
              v-for="label in visibleLabels"
              :key="label"
              :label="getCaracteristicaFieldConfig(label).displayLabel"
              class="w-full min-w-0"
            >
              <div
                v-if="getCaracteristicaFieldConfig(label).kind === 'value_with_unit'"
                class="flex gap-2 items-stretch"
              >
                <UInput
                  class="min-w-0 flex-1"
                  :disabled="readonly"
                  :model-value="localItem.caracteristicas[label] || ''"
                  placeholder="—"
                  size="sm"
                  @update:model-value="updateCaracteristica(label, $event)"
                />
                <USelect
                  class="w-[7.5rem] shrink-0"
                  :disabled="readonly"
                  :model-value="localItem.caracteristicas[getCaracteristicaFieldConfig(label).unitKey!] || undefined"
                  :items="selectOptions(getCaracteristicaFieldConfig(label).options || [])"
                  placeholder="Medida"
                  size="sm"
                  @update:model-value="updateCaracteristica(getCaracteristicaFieldConfig(label).unitKey!, String($event ?? ''))"
                />
              </div>
              <USelect
                v-else-if="getCaracteristicaFieldConfig(label).kind === 'select'"
                class="w-full"
                :disabled="readonly"
                :model-value="localItem.caracteristicas[label] || undefined"
                :items="selectOptions(getCaracteristicaFieldConfig(label).options || [])"
                placeholder="Seleccionar"
                size="sm"
                @update:model-value="updateCaracteristica(label, String($event ?? ''))"
              />
              <UInput
                v-else
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
