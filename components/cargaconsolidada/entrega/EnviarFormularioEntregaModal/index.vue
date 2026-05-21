<template>
  <UModal v-model:open="isOpen" class="sm:max-w-lg" @update:open="onModalOpenChange">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Enviar formulario de entrega
      </h3>
    </template>

    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-gray-500">
          Selecciona los clientes a quienes enviar el formulario por WhatsApp. También aparecen quienes aún no tienen formulario asociado.
        </p>

        <div class="flex flex-wrap items-center gap-2">
          <UButton size="xs" color="primary" variant="outline" @click="selectAll">
            Seleccionar todos
          </UButton>
          <UButton size="xs" color="success" variant="outline" @click="applyQuickSelection('lima')">
            Solo Lima
          </UButton>
          <UButton size="xs" color="warning" variant="outline" @click="applyQuickSelection('provincia')">
            Solo Provincia
          </UButton>
        </div>

        <div class="flex items-center gap-2 border-b border-gray-200 pb-2">
          <UCheckbox
            :model-value="allSelected"
            :indeterminate="someSelected && !allSelected"
            :label="allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'"
            @update:model-value="toggleAll"
          />
        </div>

        <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
          <div
            v-for="cliente in clientesLista"
            :key="cliente.id"
            class="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div class="flex items-center gap-3">
              <UCheckbox
                :model-value="selectedIds.includes(cliente.id)"
                @update:model-value="toggleCliente(cliente.id)"
              />
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ cliente.nombre }}</p>
                <p class="text-xs text-gray-500">{{ cliente.telefono || 'Sin teléfono' }}</p>
              </div>
            </div>
            <UBadge
              :label="tipoEntregaLabel(cliente.type_form)"
              :color="tipoEntregaColor(cliente.type_form)"
              variant="soft"
              size="xs"
            />
          </div>

          <div v-if="clientesLista.length === 0" class="py-4 text-center text-sm text-gray-400">
            No hay clientes en este consolidado.
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs text-gray-400">{{ selectedIds.length }} seleccionado(s)</span>
        <div class="flex gap-2">
          <UButton color="neutral" variant="outline" @click="close">Cancelar</UButton>
          <UButton
            color="primary"
            icon="i-heroicons-paper-airplane"
            :loading="sending"
            :disabled="selectedIds.length === 0 || sending"
            @click="confirmSelection"
          >
            Enviar formulario
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type {
  ClienteFormularioEntrega,
  EnviarFormularioEntregaModalProps,
  FormularioEntregaSeleccion
} from './types'
import { computed, ref, watch } from 'vue'
import { UBadge, UButton, UCheckbox } from '#components'

function normalizeTypeFormEntrega(raw: unknown): 0 | 1 | null {
  if (raw === 1 || raw === '1') return 1
  if (raw === 0 || raw === '0') return 0
  return null
}

const props = defineProps<EnviarFormularioEntregaModalProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
  (e: 'confirm', clientes: FormularioEntregaSeleccion[]): void
}>()

const isOpen = computed({
  get: () => props.modelValue ?? false,
  set: (value: boolean) => emit('update:modelValue', value)
})

const clientesLista = computed((): ClienteFormularioEntrega[] => {
  const list = props.clientes || []
  const out: ClienteFormularioEntrega[] = []
  for (const c of list) {
    const id = Number(c?.id)
    if (!id) continue
    out.push({
      id,
      nombre: String(c?.nombre ?? ''),
      telefono: c?.telefono,
      type_form: normalizeTypeFormEntrega(c?.type_form)
    })
  }
  return out
})

const selectedIds = ref<number[]>([])

const allSelected = computed(() => {
  return clientesLista.value.length > 0 && selectedIds.value.length === clientesLista.value.length
})

const someSelected = computed(() => selectedIds.value.length > 0)

watch(
  () => [props.modelValue, clientesLista.value] as const,
  ([open, list]) => {
    if (open) {
      selectedIds.value = list.map((c) => c.id)
    }
  },
  { immediate: true }
)

const selectAll = () => {
  selectedIds.value = clientesLista.value.map((c) => c.id)
}

const toggleAll = (value: boolean) => {
  selectedIds.value = value ? clientesLista.value.map((c) => c.id) : []
}

const toggleCliente = (id: number) => {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((x) => x !== id)
  } else {
    selectedIds.value = [...selectedIds.value, id]
  }
}

const applyQuickSelection = (scope: 'lima' | 'provincia') => {
  const desiredType = scope === 'lima' ? 1 : 0
  selectedIds.value = clientesLista.value
    .filter((c) => c.type_form === desiredType)
    .map((c) => c.id)
}

const tipoEntregaLabel = (typeForm: 0 | 1 | null) => {
  if (typeForm === 1) return 'Lima'
  if (typeForm === 0) return 'Provincia'
  return 'Sin formulario'
}

const tipoEntregaColor = (typeForm: 0 | 1 | null): 'success' | 'warning' | 'neutral' => {
  if (typeForm === 1) return 'success'
  if (typeForm === 0) return 'warning'
  return 'neutral'
}

const close = () => {
  emit('close')
  isOpen.value = false
}

const onModalOpenChange = (open: boolean) => {
  if (!open) emit('close')
}

const confirmSelection = () => {
  const selectedSet = new Set(selectedIds.value)
  const payload: FormularioEntregaSeleccion[] = clientesLista.value
    .filter((cliente) => selectedSet.has(cliente.id))
    .map((cliente) => ({
      id_cotizacion: cliente.id,
      type_form: cliente.type_form === 0 || cliente.type_form === 1 ? cliente.type_form : null
    }))

  emit('confirm', payload)
}
</script>
