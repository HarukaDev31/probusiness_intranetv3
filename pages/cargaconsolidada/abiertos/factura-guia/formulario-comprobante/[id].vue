<template>
  <div class="p-6">
    <PageHeader
      :title="`Formulario Comprobante`"
      :subtitle="`Cotización #${idCotizacion}`"
      icon=""
      :hide-back-button="false"
      @back="$router.back()"
    />

    <!-- Skeleton -->
    <div v-if="loading" class="max-w-2xl mx-auto mt-6 space-y-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <USkeleton class="h-5 w-40" />
        <div class="space-y-3">
          <div v-for="i in 4" :key="i" class="flex items-center justify-between">
            <USkeleton class="h-4 w-32" />
            <USkeleton class="h-4 w-48" />
          </div>
        </div>
      </div>
    </div>

    <!-- No form submitted -->
    <div v-else-if="!form" class="max-w-2xl mx-auto mt-6">
      <UCard>
        <div class="flex flex-col items-center py-12 space-y-3 text-center">
          <UIcon name="i-heroicons-document-text" class="w-12 h-12 text-gray-400" />
          <p class="text-gray-500 dark:text-gray-400 text-lg font-medium">El cliente aún no ha enviado el formulario.</p>
          <p class="text-gray-400 dark:text-gray-500 text-sm">Cuando el cliente complete el formulario de comprobante, los datos aparecerán aquí.</p>
        </div>
      </UCard>
    </div>

    <!-- Form data -->
    <div v-else class="max-w-2xl mx-auto mt-6">
      <!-- VIEW MODE -->
      <UCard v-if="!editing">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-document-check" class="w-5 h-5 text-green-500" />
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Datos enviados por el cliente</h3>
            </div>
            <UButton icon="i-heroicons-pencil-square" color="primary" variant="ghost" size="sm" @click="startEdit">
              Editar
            </UButton>
          </div>
        </template>

        <dl class="space-y-4">
          <div class="flex items-start justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo de comprobante</dt>
            <dd class="text-sm text-gray-900 dark:text-white font-semibold">
              <UBadge :color="form.tipo_comprobante === 'FACTURA' ? 'info' : 'success'" :label="form.tipo_comprobante" variant="soft" />
            </dd>
          </div>

          <div v-if="form.destino_entrega" class="flex items-start justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Destino de entrega</dt>
            <dd class="text-sm text-gray-900 dark:text-white">{{ form.destino_entrega }}</dd>
          </div>

          <!-- FACTURA fields -->
          <template v-if="form.tipo_comprobante === 'FACTURA'">
            <div class="flex items-start justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">RUC</dt>
              <dd class="text-sm text-gray-900 dark:text-white font-mono">{{ form.ruc || '—' }}</dd>
            </div>
            <div class="flex items-start justify-between py-3">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Razón social</dt>
              <dd class="text-sm text-gray-900 dark:text-white">{{ form.razon_social || '—' }}</dd>
            </div>
          </template>

          <!-- BOLETA fields -->
          <template v-else-if="form.tipo_comprobante === 'BOLETA'">
            <div class="flex items-start justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre completo</dt>
              <dd class="text-sm text-gray-900 dark:text-white">{{ form.nombre_completo || '—' }}</dd>
            </div>
            <div class="flex items-start justify-between py-3">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">DNI / Carnet</dt>
              <dd class="text-sm text-gray-900 dark:text-white font-mono">{{ form.dni_carnet || '—' }}</dd>
            </div>
          </template>
        </dl>

        <template #footer>
          <p class="text-xs text-gray-400 dark:text-gray-500">
            Enviado el {{ formatDate(form.created_at) }}
          </p>
        </template>
      </UCard>

      <!-- EDIT MODE -->
      <UCard v-else>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-pencil-square" class="w-5 h-5 text-primary-500" />
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Editar formulario</h3>
          </div>
        </template>

        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo comprobante</label>
            <USelect v-model="editForm.tipo_comprobante" :items="tipoComprobanteOptions" value-key="value" label-key="label" placeholder="Seleccionar..." />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destino de entrega</label>
            <USelect v-model="editForm.destino_entrega" :items="destinoEntregaOptions" value-key="value" label-key="label" placeholder="Seleccionar..." />
          </div>

          <template v-if="editForm.tipo_comprobante === 'FACTURA'">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Razón social</label>
              <UInput v-model="editForm.razon_social" placeholder="Razón social" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RUC</label>
              <UInput v-model="editForm.ruc" placeholder="RUC" />
            </div>
          </template>

          <template v-if="editForm.tipo_comprobante === 'BOLETA'">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre completo</label>
              <UInput v-model="editForm.nombre_completo" placeholder="Nombre completo" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DNI / Carnet</label>
              <UInput v-model="editForm.dni_carnet" placeholder="DNI o carnet" />
            </div>
          </template>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="outline" :disabled="saving" @click="cancelEdit">Cancelar</UButton>
            <UButton color="primary" :loading="saving" :disabled="saving" @click="handleSave">
              Guardar cambios
            </UButton>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useComprobanteForm } from '~/composables/cargaconsolidada/useComprobanteForm'
import { ContabilidadService } from '~/services/cargaconsolidada/factura-guia/contabilidadService'
import { useModal } from '~/composables/commons/useModal'

const route = useRoute()
const idCotizacion = Number(route.params.id)
const { showSuccess, showError } = useModal()
const { form, loading, getFormByCotizacion } = useComprobanteForm()

const editing = ref(false)
const saving = ref(false)
const editForm = ref({
  tipo_comprobante: '',
  destino_entrega: null as string | null,
  razon_social: null as string | null,
  ruc: null as string | null,
  nombre_completo: null as string | null,
  dni_carnet: null as string | null,
})

const tipoComprobanteOptions = [
  { label: 'FACTURA', value: 'FACTURA' },
  { label: 'BOLETA', value: 'BOLETA' },
]

const destinoEntregaOptions = [
  { label: 'Lima', value: 'Lima' },
  { label: 'Provincia', value: 'Provincia' },
]

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const startEdit = () => {
  if (!form.value) return
  editForm.value = {
    tipo_comprobante: form.value.tipo_comprobante ?? '',
    destino_entrega: form.value.destino_entrega ?? null,
    razon_social: form.value.razon_social ?? null,
    ruc: form.value.ruc ?? null,
    nombre_completo: form.value.nombre_completo ?? null,
    dni_carnet: form.value.dni_carnet ?? null,
  }
  editing.value = true
}

const cancelEdit = () => {
  editing.value = false
}

const handleSave = async () => {
  saving.value = true
  try {
    const res = await ContabilidadService.updateComprobanteForm(idCotizacion, editForm.value)
    if (res.success) {
      showSuccess('Guardado', 'Formulario actualizado correctamente.')
      editing.value = false
      await getFormByCotizacion(idCotizacion)
    } else {
      showError('Error', res.message || 'No se pudo guardar el formulario.')
    }
  } catch (e) {
    showError('Error', 'No se pudo guardar el formulario.')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await getFormByCotizacion(idCotizacion)
})
</script>
