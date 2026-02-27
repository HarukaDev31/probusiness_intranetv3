<template>
  <div class="p-6">
    <PageHeader
      :title="`Contabilidad — ${cliente?.nombre || ''}`"
      :subtitle="`Consolidado #${$route.query.carga || ''}`"
      icon=""
      :hide-back-button="false"
      @back="$router.back()"
    />

    <!-- Skeleton de carga -->
    <div v-if="loading" class="flex flex-col lg:flex-row gap-6 mt-6">
      <!-- Izquierda: tarjetas principales -->
      <div class="flex-1 space-y-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
          <div class="flex items-center justify-between">
            <USkeleton class="h-4 w-32" />
            <USkeleton class="h-4 w-24" />
          </div>
          <USkeleton class="h-8 w-56 rounded-md" />
          <div class="space-y-2 mt-2">
            <div v-for="i in 3" :key="`sk-comp-${i}`" class="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700">
              <div class="flex items-center gap-3 min-w-0">
                <USkeleton class="w-5 h-5 rounded" />
                <div class="space-y-1 w-40">
                  <USkeleton class="h-3 w-full" />
                  <USkeleton class="h-3 w-24" />
                </div>
              </div>
              <USkeleton class="h-6 w-16 rounded-md" />
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
          <div class="flex items-center justify-between">
            <USkeleton class="h-4 w-32" />
            <USkeleton class="h-4 w-24" />
          </div>
          <div class="space-y-2">
            <div v-for="i in 2" :key="`sk-det-${i}`" class="rounded-lg border border-orange-100 dark:border-orange-900/30 bg-orange-50/40 dark:bg-orange-900/10 p-3 space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <USkeleton class="w-5 h-5 rounded" />
                  <div class="space-y-1 w-40">
                    <USkeleton class="h-3 w-full" />
                    <USkeleton class="h-3 w-24" />
                  </div>
                </div>
                <USkeleton class="h-6 w-16 rounded-md" />
              </div>
              <div class="pl-7 space-y-2">
                <USkeleton class="h-3 w-40" />
                <USkeleton class="h-3 w-24" />
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
          <USkeleton class="h-4 w-40" />
          <USkeleton class="h-8 w-52 rounded-md" />
          <div class="space-y-2 mt-1">
            <div v-for="i in 2" :key="`sk-guia-${i}`" class="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700">
              <div class="flex items-center gap-3 min-w-0">
                <USkeleton class="w-5 h-5 rounded" />
                <USkeleton class="h-3 w-40" />
              </div>
              <USkeleton class="h-6 w-10 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      <!-- Derecha: estado documentos + resumen + nota -->
      <div class="w-full lg:w-72 space-y-6 mt-6 lg:mt-0">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
          <USkeleton class="h-4 w-40" />
          <div class="space-y-3 mt-2">
            <div v-for="i in 3" :key="`sk-doc-${i}`" class="flex items-center justify-between">
              <USkeleton class="h-3 w-28" />
              <USkeleton class="h-5 w-5 rounded-full" />
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
          <USkeleton class="h-4 w-32" />
          <div class="space-y-2">
            <div v-for="i in 3" :key="`sk-res-${i}`" class="flex items-center justify-between">
              <USkeleton class="h-3 w-28" />
              <USkeleton class="h-3 w-16" />
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
          <USkeleton class="h-4 w-32" />
          <USkeleton class="h-20 w-full rounded-md" />
          <div class="flex justify-end">
            <USkeleton class="h-8 w-24 rounded-md" />
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col lg:flex-row gap-6 mt-6">
      <!-- ── Panel izquierdo: Comprobantes + Detracciones + Guía ──────────── -->
      <div class="flex-1 space-y-6">

        <!-- Comprobantes -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold text-base">Comprobantes</h2>
            <span class="text-sm text-gray-500">
              Total: <span class="font-semibold text-primary-600">{{ formatCurrency(totalComprobantes,'PEN') }}</span>
            </span>
          </div>

          <!-- Upload button -->
          <div class="mb-3">
            <UButton
              icon="i-heroicons-arrow-up-tray"
              color="primary"
              variant="outline"
              size="sm"
              @click="triggerComprobante"
            >
              Subir comprobante (PDF/Word)
            </UButton>
            <input ref="fileInputComprobante" type="file" accept=".pdf,.doc,.docx" class="hidden" @change="handleUploadComprobante" />
          </div>

          <!-- List -->
          <div v-if="comprobantes.length === 0" class="text-sm text-gray-400 py-3 text-center">
            No se han subido comprobantes aún.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="item in comprobantes"
              :key="item.id"
              class="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700"
            >
              <div class="flex items-center gap-3 min-w-0">
                <UIcon name="i-heroicons-document-text" class="text-blue-500 w-5 h-5 flex-shrink-0" />
                <div class="min-w-0">
                  <p class="text-sm font-medium truncate">{{ item.file_name }}</p>
                  <div class="flex flex-wrap gap-2 mt-0.5">
                    <UBadge v-if="item.tipo_comprobante" :label="item.tipo_comprobante" color="info" variant="soft" size="xs" />
                    <span v-if="item.valor_comprobante" class="text-xs text-gray-500">
                      Total: {{ formatMoney(item.valor_comprobante) }}
                    </span>
                    <UBadge v-if="item.tiene_detraccion" label="Con detracción" color="warning" variant="soft" size="xs" />
                    <UBadge v-if="item.extracted_by_ai" label="IA" color="primary" variant="subtle" size="xs" />
                  </div>
                </div>
              </div>
              <div class="flex gap-1 flex-shrink-0">
                <UButton
                  v-if="item.file_url"
                  icon="i-heroicons-arrow-down-tray"
                  color="primary"
                  variant="ghost"
                  size="xs"
                  @click="openFile(item.file_url)"
                />
                <UButton
                  icon="i-heroicons-trash"
                  color="error"
                  variant="ghost"
                  size="xs"
                  @click="handleDeleteComprobante(item.id)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Detracciones -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold text-base">Detracciones</h2>
            <span class="text-sm text-gray-500">
              Declarado: <span class="font-semibold text-warning-600">S/ {{ formatMoney(totalDetracciones) }}</span>
            </span>
          </div>

          <div v-if="comprobantesConDetraccion.length === 0" class="text-sm text-gray-400 py-3 text-center">
            No hay comprobantes con detracción.
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="item in comprobantesConDetraccion"
              :key="item.id"
              class="rounded-lg border border-orange-100 dark:border-orange-900/30 bg-orange-50/40 dark:bg-orange-900/10 p-3 space-y-2"
            >
              <!-- Fila del comprobante con sus montos de detracción -->
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <UIcon name="i-heroicons-document-text" class="text-orange-500 w-5 h-5 flex-shrink-0" />
                  <div class="min-w-0">
                    <p class="text-sm font-medium truncate">{{ item.file_name }}</p>
                    <div class="flex flex-wrap gap-2 mt-0.5">
                      <span v-if="item.monto_detraccion_dolares" class="text-xs text-gray-500">
                        USD {{ formatMoney(item.monto_detraccion_dolares) }}
                      </span>
                      <span v-if="item.monto_detraccion_soles" class="text-xs font-medium text-warning-600">
                        S/ {{ formatMoney(item.monto_detraccion_soles) }}
                      </span>
                    </div>
                  </div>
                </div>
                <UButton
                  v-if="item.file_url"
                  icon="i-heroicons-arrow-down-tray"
                  color="primary"
                  variant="ghost"
                  size="xs"
                  class="flex-shrink-0"
                  @click="openFile(item.file_url)"
                />
              </div>

              <!-- Constancia de pago de detracción -->
              <div class="pl-7">
                <!-- Ya tiene constancia -->
                <div v-if="item.constancia" class="flex items-center justify-between p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  <div class="flex items-center gap-2 min-w-0">
                    <UIcon name="i-heroicons-document-check" class="text-green-500 w-4 h-4 flex-shrink-0" />
                    <div class="min-w-0">
                      <p class="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{{ item.constancia.file_name }}</p>
                      <p v-if="item.constancia.monto_detraccion" class="text-xs text-green-600 font-semibold">
                        Pagado: S/ {{ formatMoney(item.constancia.monto_detraccion) }}
                      </p>
                    </div>
                  </div>
                  <div class="flex gap-1 flex-shrink-0">
                    <UButton
                      v-if="item.constancia.file_url"
                      icon="i-heroicons-arrow-down-tray"
                      color="primary"
                      variant="ghost"
                      size="xs"
                      @click="openFile(item.constancia.file_url)"
                    />
                    <UButton
                      icon="i-heroicons-trash"
                      color="error"
                      variant="ghost"
                      size="xs"
                      @click="handleDeleteConstancia(item.constancia.id)"
                    />
                  </div>
                </div>

                <!-- Sin constancia: botón para subir -->
                <div v-else class="flex items-center gap-2">
                  <UButton
                    icon="i-heroicons-arrow-up-tray"
                    color="warning"
                    variant="outline"
                    size="xs"
                    @click="triggerConstancia(item.id)"
                  >
                    Subir constancia de pago
                  </UButton>
                  <span class="text-xs text-gray-400">Constancia SUNAT (PDF)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Input oculto compartido para constancias -->
          <input
            ref="fileInputConstancia"
            type="file"
            accept=".pdf,.doc,.docx"
            class="hidden"
            @change="handleUploadConstancia"
          />
        </div>

        <!-- Guía de Remisión -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold text-base">Guía de Remisión</h2>
          </div>

          <div class="mb-3">
            <UButton
              icon="i-heroicons-arrow-up-tray"
              color="primary"
              variant="outline"
              size="sm"
              @click="triggerGuia"
            >
              Subir guía (PDF/Word)
            </UButton>
            <input ref="fileInputGuia" type="file" accept=".pdf,.doc,.docx" class="hidden" @change="handleUploadGuia" />
          </div>

          <div v-if="!guiasRemisionList.length" class="text-sm text-gray-400 py-3 text-center">
            Aún no hay guías de remisión subidas.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="guia in guiasRemisionList"
              :key="guia.id"
              class="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700"
            >
              <div class="flex items-center gap-3 min-w-0">
                <UIcon name="i-heroicons-document-text" class="text-green-500 w-5 h-5 flex-shrink-0" />
                <span class="text-sm font-medium truncate">{{ guia.file_name || 'Guía de remisión' }}</span>
              </div>
              <div class="flex gap-1 flex-shrink-0">
                <UButton
                  v-if="guia.file_url"
                  icon="i-heroicons-arrow-down-tray"
                  color="primary"
                  variant="ghost"
                  size="xs"
                  @click="openFile(guia.file_url)"
                />
                <UButton
                  v-if="guia.id"
                  icon="i-heroicons-trash"
                  color="error"
                  variant="ghost"
                  size="xs"
                  @click="handleDeleteGuia(guia.id)"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ── Panel derecho: Estado documentos + Nota ──────────────────────── -->
      <div class="w-full lg:w-72 space-y-6">

        <!-- Estado de documentos -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 class="font-semibold text-base mb-4">Estado de documentos</h2>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Cotización Inicial</span>
              <UIcon
                :name="panel?.tiene_cotizacion_inicial ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                :class="panel?.tiene_cotizacion_inicial ? 'text-green-500' : 'text-gray-300'"
                class="w-5 h-5"
              />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Cotización Final</span>
              <UIcon
                :name="panel?.tiene_cotizacion_final ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                :class="panel?.tiene_cotizacion_final ? 'text-green-500' : 'text-gray-300'"
                class="w-5 h-5"
              />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Contrato</span>
              <UIcon
                :name="panel?.tiene_contrato ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                :class="panel?.tiene_contrato ? 'text-green-500' : 'text-gray-300'"
                class="w-5 h-5"
              />
            </div>
          </div>
        </div>

        <!-- Resumen -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-2">
          <h2 class="font-semibold text-base mb-2">Resumen</h2>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">Total comprobantes</span>
            <span class="font-semibold text-primary-600">{{ formatMoney(totalComprobantes) }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">Detracciones declarado</span>
            <span class="font-semibold text-warning-600">S/ {{ formatMoney(totalDetracciones) }}</span>
          </div>
          <div v-if="totalConstanciasPagadas > 0" class="flex items-center justify-between text-sm border-t border-gray-100 pt-2 mt-2">
            <span class="text-gray-500">Constancias pagadas</span>
            <span class="font-semibold text-green-600">S/ {{ formatMoney(totalConstanciasPagadas) }}</span>
          </div>
        </div>

        <!-- Nota interna -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 class="font-semibold text-base mb-3">Nota interna</h2>
          <UTextarea
            v-model="nota"
            placeholder="Escribe una nota interna..."
            :rows="4"
            size="sm"
            class="w-full"
          />
          <div class="flex justify-end mt-2">
            <UButton
              size="sm"
              color="primary"
              variant="solid"
              :loading="savingNota"
              @click="handleSaveNota"
            >
              Guardar nota
            </UButton>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { UButton, UBadge, UIcon, UTextarea, USkeleton } from '#components'
import { useContabilidadDetalle } from '~/composables/cargaconsolidada/factura-guia/useContabilidadDetalle'
import { GeneralService } from '~/services/cargaconsolidada/factura-guia/generalService'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'

const route = useRoute()
const id = Number(route.params.id)

const {
  loading,
  cliente,
  comprobantes,
  totalComprobantes,
  totalDetracciones,
  panel,
  nota,
  getDetalle,
  uploadComprobante,
  uploadConstancia,
  deleteComprobante,
  deleteConstancia,
  saveNota,
} = useContabilidadDetalle()

const { showSuccess, showError, showConfirmation } = useModal()
const { withSpinner } = useSpinner()

const fileInputComprobante = ref<HTMLInputElement | null>(null)
const fileInputConstancia = ref<HTMLInputElement | null>(null)
const fileInputGuia = ref<HTMLInputElement | null>(null)
const savingNota = ref(false)
const pendingComprobanteId = ref<number | null>(null)

// Comprobantes que tienen detracción (para la sección de Detracciones)
const comprobantesConDetraccion = computed(() =>
  comprobantes.value.filter((c: any) => c.tiene_detraccion)
)

// Suma de lo efectivamente pagado en constancias
const totalConstanciasPagadas = computed(() =>
  comprobantesConDetraccion.value
    .filter((c: any) => c.constancia?.monto_detraccion)
    .reduce((sum: number, c: any) => sum + Number(c.constancia.monto_detraccion), 0)
)

// Lista de guías de remisión (múltiples por cotización)
const guiasRemisionList = computed(() => {
  const list = panel.value?.guias_remision
  if (Array.isArray(list)) return list
  // Compat: si el backend solo envía guia_remision_url, mostrar una entrada
  if (panel.value?.guia_remision_url) {
    return [{ id: 0, file_name: panel.value.guia_remision_file_name || 'Guía', file_url: panel.value.guia_remision_url }]
  }
  return []
})

const formatMoney = (val: number | null | undefined) => {
  if (!val && val !== 0) return '0.00'
  return Number(val).toFixed(2)
}

const openFile = (url: string) => {
  window.open(url, '_blank')
}

const triggerComprobante = () => fileInputComprobante.value?.click()

const triggerConstancia = (comprobanteId: number) => {
  pendingComprobanteId.value = comprobanteId
  fileInputConstancia.value?.click()
}

const triggerGuia = () => fileInputGuia.value?.click()

const handleUploadGuia = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  await withSpinner(async () => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('idCotizacion', String(id))
    const res = await GeneralService.uploadGuiaRemision(formData)
    if (res?.success !== false) {
      showSuccess('Guía subida', 'La guía de remisión se subió correctamente y se verá en la tabla de Factura y Guía.')
      await getDetalle(id)
    } else {
      showError('Error', (res as any)?.message || 'Error al subir guía')
    }
    if (fileInputGuia.value) fileInputGuia.value.value = ''
  }, 'Subiendo guía...')
}

const handleDeleteGuia = (guiaId: number) => {
  showConfirmation(
    'Eliminar guía de remisión',
    '¿Está seguro de que desea eliminar esta guía?',
    async () => {
      await withSpinner(async () => {
        const res = await GeneralService.deleteGuiaRemision(guiaId)
        if (res?.success !== false) {
          showSuccess('Eliminada', 'Guía de remisión eliminada correctamente.')
          await getDetalle(id)
        } else {
          showError('Error', (res as any)?.message || 'Error al eliminar guía')
        }
      }, 'Eliminando...')
    }
  )
}

const handleUploadComprobante = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  await withSpinner(async () => {
    const res = await uploadComprobante(file, id)
    if (res.success) {
      showSuccess('Comprobante subido', res.extracted ? 'Datos extraídos con IA correctamente.' : 'Archivo subido. No se pudo extraer datos automáticamente.')
      await getDetalle(id)
    } else {
      showError('Error', res.message || 'Error al subir comprobante')
    }
    if (fileInputComprobante.value) fileInputComprobante.value.value = ''
  }, 'Subiendo y analizando comprobante...')
}

const handleUploadConstancia = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !pendingComprobanteId.value) return
  const comprobanteId = pendingComprobanteId.value
  pendingComprobanteId.value = null
  await withSpinner(async () => {
    const res = await uploadConstancia(file, comprobanteId)
    if (res.success) {
      const monto = res.data?.monto_detraccion ? ` S/ ${Number(res.data.monto_detraccion).toFixed(2)}` : ''
      showSuccess('Constancia subida', res.extracted ? `Monto pagado extraído:${monto}` : 'Archivo subido. No se pudo extraer el monto automáticamente.')
      await getDetalle(id)
    } else {
      showError('Error', res.message || 'Error al subir constancia')
    }
    if (fileInputConstancia.value) fileInputConstancia.value.value = ''
  }, 'Subiendo y analizando constancia de pago...')
}

const handleDeleteComprobante = (itemId: number) => {
  showConfirmation(
    'Eliminar comprobante',
    '¿Está seguro? Si tiene constancia de pago asociada, también será eliminada.',
    async () => {
      await withSpinner(async () => {
        const res = await deleteComprobante(itemId)
        if (res.success) {
          showSuccess('Eliminado', 'Comprobante eliminado correctamente.')
          await getDetalle(id)
        } else {
          showError('Error', res.message || 'Error al eliminar')
        }
      }, 'Eliminando...')
    }
  )
}

const handleDeleteConstancia = (itemId: number) => {
  showConfirmation(
    'Eliminar constancia',
    '¿Está seguro de que desea eliminar esta constancia de pago?',
    async () => {
      await withSpinner(async () => {
        const res = await deleteConstancia(itemId)
        if (res.success) {
          showSuccess('Eliminado', 'Constancia eliminada correctamente.')
          await getDetalle(id)
        } else {
          showError('Error', res.message || 'Error al eliminar')
        }
      }, 'Eliminando...')
    }
  )
}

const handleSaveNota = async () => {
  savingNota.value = true
  try {
    const res = await saveNota(id)
    if (res.success) {
      showSuccess('Nota guardada', 'La nota interna se guardó correctamente.')
    } else {
      showError('Error', res.message || 'Error al guardar nota')
    }
  } finally {
    savingNota.value = false
  }
}

onMounted(async () => {
  await getDetalle(id)
})
</script>
