<template>
  <UModal :modelValue="true" @close="handleClose" class="sm:max-w-lg">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Editar formulario de comprobante</h3>
    </template>

    <template #body>
      <div class="space-y-4">
        <div v-if="loading" class="flex justify-center py-6">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin text-primary-500 w-6 h-6" />
        </div>

        <template v-else-if="form">
          <!-- Tipo comprobante -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo comprobante</label>
            <USelect v-model="form.tipo_comprobante" :options="tipoComprobanteOptions" placeholder="Seleccionar..." />
          </div>

          <!-- Destino entrega -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destino de entrega</label>
            <USelect v-model="form.destino_entrega" :options="destinoEntregaOptions" placeholder="Seleccionar..." />
          </div>

          <!-- Campos FACTURA -->
          <template v-if="form.tipo_comprobante === 'FACTURA'">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Razón social</label>
              <UInput v-model="form.razon_social" placeholder="Razón social" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RUC</label>
              <UInput v-model="form.ruc" placeholder="RUC" />
            </div>
          </template>

          <!-- Campos BOLETA -->
          <template v-if="form.tipo_comprobante === 'BOLETA'">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre completo</label>
              <UInput v-model="form.nombre_completo" placeholder="Nombre completo" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DNI / Carnet</label>
              <UInput v-model="form.dni_carnet" placeholder="DNI o carnet" />
            </div>
          </template>
        </template>

        <div v-else class="text-center text-gray-400 py-4 text-sm">No se encontró el formulario.</div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="error" variant="outline" @click="handleClose">Cancelar</UButton>
        <UButton color="primary" :loading="saving" :disabled="!form || saving" @click="handleSave">
          Guardar cambios
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { USelect, UInput, UButton, UIcon } from '#components'
import { ContabilidadService } from '~/services/cargaconsolidada/factura-guia/contabilidadService'

const props = defineProps<{
  idCotizacion: number
  onClose?: () => void
  onSaved?: () => void
}>()

const loading = ref(false)
const saving = ref(false)
const form = ref<{
  tipo_comprobante: string
  destino_entrega: string | null
  razon_social: string | null
  ruc: string | null
  nombre_completo: string | null
  dni_carnet: string | null
} | null>(null)

const tipoComprobanteOptions = [
  { label: 'FACTURA', value: 'FACTURA' },
  { label: 'BOLETA', value: 'BOLETA' },
]

const destinoEntregaOptions = [
  { label: 'Lima', value: 'Lima' },
  { label: 'Provincia', value: 'Provincia' },
]

const handleClose = () => props.onClose?.()

const handleSave = async () => {
  if (!form.value) return
  saving.value = true
  try {
    const res = await ContabilidadService.updateComprobanteForm(props.idCotizacion, form.value)
    if (res.success) {
      props.onSaved?.()
    }
  } catch (e) {
    console.error('Error al guardar formulario:', e)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await ContabilidadService.getComprobanteForm(props.idCotizacion)
    if (res.success && res.data) {
      form.value = {
        tipo_comprobante: res.data.tipo_comprobante ?? '',
        destino_entrega: res.data.destino_entrega ?? null,
        razon_social: res.data.razon_social ?? null,
        ruc: res.data.ruc ?? null,
        nombre_completo: res.data.nombre_completo ?? null,
        dni_carnet: res.data.dni_carnet ?? null,
      }
    }
  } catch (e) {
    console.error('Error al cargar formulario:', e)
  } finally {
    loading.value = false
  }
})
</script>
