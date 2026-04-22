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
          Selecciona los clientes con tipo de entrega válido para enviarles el formulario por WhatsApp.
        </p>

        <div class="flex flex-wrap items-center gap-2">
          
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
            v-for="cliente in clientesConTipo"
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
              :label="cliente.type_form === 1 ? 'Lima' : 'Provincia'"
              :color="cliente.type_form === 1 ? 'success' : 'warning'"
              variant="soft"
              size="xs"
            />
          </div>

          <div v-if="clientesConTipo.length === 0" class="py-4 text-center text-sm text-gray-400">
            No hay clientes con T. Entrega (Lima/Provincia) para enviar.
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
import { computed, ref, watch } from 'vue'
import { UBadge, UButton, UCheckbox } from '#components'

type ClienteFormulario = {
  id: number
  nombre: string
  telefono?: string
  type_form: 0 | 1
}

type FormularioEntregaSeleccion = {
  id_cotizacion: number
  type_form: 0 | 1
}

/** Solo 0/1 explícitos; null/undefined/Number(null) no cuentan (evita mostrar "Provincia" por error). */
function normalizeTypeFormEntrega(raw: unknown): 0 | 1 | null {
  if (raw === 1 || raw === '1') return 1
  if (raw === 0 || raw === '0') return 0
  return null
}

const props = defineProps<{
  modelValue?: boolean
  clientes: ClienteFormulario[]
  sending?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
  (e: 'confirm', clientes: FormularioEntregaSeleccion[]): void
}>()

const isOpen = computed({
  get: () => props.modelValue ?? false,
  set: (value: boolean) => emit('update:modelValue', value)
})

const clientesConTipo = computed((): ClienteFormulario[] => {
  const list = props.clientes || []
  const out: ClienteFormulario[] = []
  for (const c of list) {
    const tf = normalizeTypeFormEntrega(c?.type_form)
    const id = Number(c?.id)
    if (!id || tf === null) continue
    out.push({
      id,
      nombre: String(c?.nombre ?? ''),
      telefono: c?.telefono,
      type_form: tf
    })
  }
  return out
})

const selectedIds = ref<number[]>([])

const allSelected = computed(() => {
  return clientesConTipo.value.length > 0 && selectedIds.value.length === clientesConTipo.value.length
})

const someSelected = computed(() => selectedIds.value.length > 0)

watch(
  () => [props.modelValue, clientesConTipo.value] as const,
  ([open, list]) => {
    if (open) {
      selectedIds.value = list.map((c) => c.id)
    }
  },
  { immediate: true }
)

const toggleAll = (value: boolean) => {
  selectedIds.value = value ? clientesConTipo.value.map((c) => c.id) : []
}

const toggleCliente = (id: number) => {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((x) => x !== id)
  } else {
    selectedIds.value = [...selectedIds.value, id]
  }
}

const applyQuickSelection = (scope: 'all' | 'lima' | 'provincia') => {
  if (scope === 'all') {
    selectedIds.value = clientesConTipo.value.map((c) => c.id)
    return
  }

  const desiredType = scope === 'lima' ? 1 : 0
  selectedIds.value = clientesConTipo.value
    .filter((c) => c.type_form === desiredType)
    .map((c) => c.id)
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
  const payload: FormularioEntregaSeleccion[] = clientesConTipo.value
    .filter((cliente) => selectedSet.has(cliente.id))
    .map((cliente) => ({
      id_cotizacion: cliente.id,
      type_form: cliente.type_form
    }))

  emit('confirm', payload)
}
</script>
