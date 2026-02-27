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
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-document-check" class="w-5 h-5 text-green-500" />
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Datos enviados por el cliente</h3>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useComprobanteForm } from '~/composables/cargaconsolidada/useComprobanteForm'

const route = useRoute()
const idCotizacion = Number(route.params.id)

const { form, loading, getFormByCotizacion } = useComprobanteForm()

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

onMounted(async () => {
  await getFormByCotizacion(idCotizacion)
})
</script>
