<template>
  <UModal :modelValue="true" @close="handleClose" class="sm:max-w-lg">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Enviar Formulario de Entrega
        </h3>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-gray-500">
          Selecciona los clientes a quienes enviar el enlace del formulario por WhatsApp (instancia Administración).
        </p>

        <!-- Loading state -->
        <div v-if="loadingClientes" class="flex justify-center py-6">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin text-primary-500 w-6 h-6" />
        </div>

        <!-- Client list -->
        <div v-else class="space-y-2 max-h-72 overflow-y-auto pr-1">
          <!-- Select all -->
          <div class="flex items-center gap-2 border-b border-gray-200 pb-2 mb-1">
            <UCheckbox
              :model-value="allSelected"
              :indeterminate="someSelected && !allSelected"
              label="Seleccionar todos"
              @update:model-value="toggleAll"
            />
          </div>

          <div
            v-for="cliente in clientes"
            :key="cliente.id"
            class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div class="flex items-center gap-3">
              <UCheckbox
                :model-value="selectedIds.includes(cliente.id)"
                @update:model-value="toggleCliente(cliente.id)"
              />
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ cliente.nombre }}</p>
                <p class="text-xs text-gray-500">{{ cliente.telefono }}</p>
              </div>
            </div>
            <UBadge
              :label="cliente.registrado ? 'Registrado' : 'Pendiente'"
              :color="cliente.registrado ? 'success' : 'warning'"
              variant="soft"
              size="xs"
            />
          </div>

          <div v-if="clientes.length === 0" class="text-center text-gray-400 py-4 text-sm">
            No se encontraron clientes para este contenedor.
          </div>
        </div>

        <!-- Result summary after send -->
        <div v-if="resultado" class="mt-3 space-y-1">
          <p v-if="resultado.enviados.length > 0" class="text-sm text-green-600">
            ✅ {{ resultado.enviados.length }} mensaje(s) enviado(s) correctamente.
          </p>
          <p v-if="resultado.errores.length > 0" class="text-sm text-red-500">
            ❌ {{ resultado.errores.length }} error(es): {{ resultado.errores.map((e: any) => e.nombre || e.id).join(', ') }}
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs text-gray-400">{{ selectedIds.length }} seleccionado(s)</span>
        <div class="flex gap-2">
          <UButton color="error" variant="outline" @click="handleClose">Cerrar</UButton>
          <UButton
            color="primary"
            icon="i-heroicons-paper-airplane"
            :loading="sending"
            :disabled="selectedIds.length === 0 || sending"
            @click="handleSend"
          >
            Enviar formulario
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { UCheckbox, UBadge, UButton, UIcon } from '#components'
import { ContabilidadService } from '~/services/cargaconsolidada/factura-guia/contabilidadService'

const props = defineProps<{
  idContenedor: number
  onClose?: () => void
  onSent?: () => void
}>()

const clientes = ref<any[]>([])
const loadingClientes = ref(false)
const selectedIds = ref<number[]>([])
const sending = ref(false)
const resultado = ref<any>(null)

const allSelected = computed(() => clientes.value.length > 0 && selectedIds.value.length === clientes.value.length)
const someSelected = computed(() => selectedIds.value.length > 0)

const toggleAll = (val: boolean) => {
  selectedIds.value = val ? clientes.value.map((c) => c.id) : []
}

const toggleCliente = (id: number) => {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((x) => x !== id)
  } else {
    selectedIds.value = [...selectedIds.value, id]
  }
}

const handleClose = () => {
  props.onClose?.()
}

const handleSend = async () => {
  if (selectedIds.value.length === 0) return
  sending.value = true
  try {
    const res = await ContabilidadService.enviarFormulario(props.idContenedor, selectedIds.value)
    resultado.value = res
    if (res.success && res.errores.length === 0) {
      props.onSent?.()
    }
  } catch (e) {
    console.error('Error al enviar formulario:', e)
  } finally {
    sending.value = false
  }
}

onMounted(async () => {
  loadingClientes.value = true
  try {
    const res = await ContabilidadService.getClientesContenedor(props.idContenedor)
    if (res.success) {
      clientes.value = res.data
    }
  } catch (e) {
    console.error('Error al cargar clientes:', e)
  } finally {
    loadingClientes.value = false
  }
})
</script>
