<template>
  <!-- Barra de filtros abierta sobre la tabla, como la maqueta: cada filtro con su etiqueta encima. -->
  <div class="mb-3 flex flex-wrap items-end gap-3 rounded-xl border border-default bg-default p-3">
    <label class="flex min-w-60 flex-1 flex-col gap-1">
      <span class="text-[11px] font-semibold uppercase tracking-wide text-muted">Buscar</span>
      <UInput
        :model-value="searchText"
        :placeholder="searchPlaceholder"
        icon="i-heroicons-magnifying-glass"
        class="w-full"
        @update:model-value="onSearch"
      />
    </label>
    <div v-for="field in fields" :key="field.key" class="flex w-full flex-col gap-1 sm:w-44">
      <span class="text-[11px] font-semibold uppercase tracking-wide text-muted">{{ field.label }}</span>
      <UPopover v-if="field.type === 'date-range'">
        <UButton color="neutral" variant="outline" icon="i-lucide-calendar" class="w-full" :label="rangeLabel(field)" />
        <template #content>
          <div class="flex flex-col gap-2 p-3">
            <UFormField label="Desde">
              <UInput type="date" :model-value="values[field.fromKey || ''] || ''" @update:model-value="(value) => emit('change', field.fromKey || '', String(value ?? ''))" />
            </UFormField>
            <UFormField label="Hasta">
              <UInput type="date" :model-value="values[field.toKey || ''] || ''" @update:model-value="(value) => emit('change', field.toKey || '', String(value ?? ''))" />
            </UFormField>
            <UButton
              v-if="values[field.fromKey || ''] || values[field.toKey || '']"
              color="primary"
              variant="link"
              label="Todas las fechas"
              @click="clearRange(field)"
            />
          </div>
        </template>
      </UPopover>
      <USelect
        v-else
        :model-value="values[field.key] ?? field.options?.[0]?.value"
        :items="field.options || []"
        value-key="value"
        label-key="label"
        :aria-label="field.label"
        class="w-full"
        @update:model-value="(value) => emit('change', field.key, String(value ?? ''))"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

type SupplierPaymentFilterField = {
  key: string
  label: string
  type?: 'select' | 'date-range'
  options?: Array<{ value: string; label: string }>
  /** Solo para `date-range`: claves de los valores Desde / Hasta. */
  fromKey?: string
  toKey?: string
}

const props = defineProps<{
  search: string
  searchPlaceholder?: string
  fields: SupplierPaymentFilterField[]
  values: Record<string, string>
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  change: [key: string, value: string]
}>()

const searchText = ref(props.search)
watch(() => props.search, (value) => { searchText.value = value })

let timer: ReturnType<typeof setTimeout> | null = null
function onSearch(value: string | number) {
  searchText.value = String(value ?? '')
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => emit('update:search', searchText.value), 350)
}
onBeforeUnmount(() => { if (timer) clearTimeout(timer) })

function shortDate(value?: string) {
  return value ? value.slice(0, 10).split('-').reverse().join('/') : ''
}

function rangeLabel(field: SupplierPaymentFilterField) {
  const from = shortDate(props.values[field.fromKey || ''])
  const to = shortDate(props.values[field.toKey || ''])
  if (!from && !to) return 'Todas las fechas'
  if (from && to) return `${from} – ${to}`
  return from ? `Desde ${from}` : `Hasta ${to}`
}

function clearRange(field: SupplierPaymentFilterField) {
  if (field.fromKey) emit('change', field.fromKey, '')
  if (field.toKey) emit('change', field.toKey, '')
}
</script>
