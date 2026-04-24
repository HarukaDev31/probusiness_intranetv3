<template>
  <div class="h-auto bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex items-start justify-between gap-4">
        <PageHeader
          :title="`Contabilidad — ${cliente?.nombre || ''}`"
          :subtitle="`Consolidado #${$route.query.carga || ''}`"
          icon=""
          :hide-back-button="false"
          @back="$router.back()"
        />
        <UButton
          color="primary"
          variant="solid"
          size="sm"
          :loading="savingAll"
          @click="handleGuardarTodo"
        >
          Guardar
        </UButton>
      </div>

      <!-- Skeleton de carga -->
      <div v-if="loading" class="mt-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-4">
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

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-3">
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

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-3">
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
          <div class="w-full lg:col-span-1 space-y-6">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-3">
          <USkeleton class="h-4 w-40" />
          <div class="space-y-3 mt-2">
            <div v-for="i in 3" :key="`sk-doc-${i}`" class="flex items-center justify-between">
              <USkeleton class="h-3 w-28" />
              <USkeleton class="h-5 w-5 rounded-full" />
            </div>
          </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-3">
          <USkeleton class="h-4 w-32" />
          <div class="space-y-2">
            <div v-for="i in 3" :key="`sk-res-${i}`" class="flex items-center justify-between">
              <USkeleton class="h-3 w-28" />
              <USkeleton class="h-3 w-16" />
            </div>
          </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-3">
          <USkeleton class="h-4 w-32" />
          <USkeleton class="h-20 w-full rounded-md" />
          <div class="flex justify-end">
            <USkeleton class="h-8 w-24 rounded-md" />
          </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="mt-6 space-y-6">
      <!-- Cabecera compacta: perfil + formulario registrado (estilo formulario cliente) -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
            <img v-if="registeredByPhotoUrl" :src="registeredByPhotoUrl" alt="Foto de perfil" class="w-full h-full object-cover" />
            <UIcon v-else name="i-heroicons-user" class="w-10 h-10 text-gray-400" />
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div class="min-w-0">
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ comprobanteForm?.prefill_from_usuario_datos_facturacion ? 'Origen de datos' : 'Registrado por' }}
                </div>
                <div class="font-semibold text-gray-900 dark:text-white truncate">{{ registeredByNombre || '—' }}</div>
                <div class="text-xs text-gray-400 dark:text-gray-500">
                  <span v-if="comprobanteForm?.prefill_from_usuario_datos_facturacion && comprobanteForm?.created_at">
                    Último registro en historial el {{ formatDate(comprobanteForm.created_at) }}
                  </span>
                  <span v-else-if="comprobanteForm?.created_at">Enviado el {{ formatDate(comprobanteForm.created_at) }}</span>
                  <span v-else>—</span>
                </div>
              </div>
              <UButton color="neutral" variant="outline" size="sm" :disabled="!comprobanteForm?.id" @click="goToFormularioComprobante">
                Ver formulario
              </UButton>
            </div>

            <div class="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4">
              <div class="md:col-span-9">
                <div class="flex flex-wrap items-center gap-2 mb-2">
                  <div class="text-sm font-semibold text-gray-900 dark:text-white">Datos de facturación</div>
                  <UBadge
                    v-if="comprobanteForm?.prefill_from_usuario_datos_facturacion"
                    color="warning"
                    variant="subtle"
                    size="xs"
                    label="Desde historial (sin formulario)"
                  />
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Tipo de comprobante</div>
                    <div>
                      <UBadge
                        v-if="comprobanteForm?.tipo_comprobante"
                        :color="comprobanteForm.tipo_comprobante === 'FACTURA' ? 'info' : 'success'"
                        :label="comprobanteForm.tipo_comprobante"
                        variant="soft"
                      />
                      <span v-else class="text-sm text-gray-400">—</span>
                    </div>
                  </div>

                  <div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {{ comprobanteForm?.tipo_comprobante === 'FACTURA' ? 'RUC' : 'DNI / Carnet' }}
                    </div>
                    <div class="text-sm font-mono text-gray-900 dark:text-white">
                      {{
                        comprobanteForm?.tipo_comprobante === 'FACTURA'
                          ? (comprobanteForm?.ruc || '—')
                          : (comprobanteForm?.dni_carnet || '—')
                      }}
                    </div>
                  </div>

                  <div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {{ comprobanteForm?.tipo_comprobante === 'FACTURA' ? 'Razón social' : 'Nombre completo' }}
                    </div>
                    <div class="text-sm text-gray-900 dark:text-white truncate">
                      {{
                        comprobanteForm?.tipo_comprobante === 'FACTURA'
                          ? (comprobanteForm?.razon_social || '—')
                          : (comprobanteForm?.nombre_completo || '—')
                      }}
                    </div>
                  </div>
                </div>

                <div v-if="comprobanteForm?.domicilio_fiscal" class="mt-4">
                  <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Domicilio fiscal</div>
                  <div class="text-sm text-gray-900 dark:text-white">{{ comprobanteForm.domicilio_fiscal }}</div>
                </div>
              </div>

              <div class="md:col-span-3">
                <div class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Datos logísticos</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Destino de entrega</div>
                <UInput :value="comprobanteForm?.destino_entrega || '—'" disabled size="sm" variant="outline" class="w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- ── Panel izquierdo: 2 cols (Comprobantes | Guía) y debajo Detracciones ──────────── -->
      <div class="lg:col-span-2 space-y-6">

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Comprobantes -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold text-base">Comprobantes</h2>
            <span class="text-sm text-gray-500">
              Total: <span class="font-semibold text-primary-600">{{ formatCurrency(totalComprobantes,'USD') }}</span>
            </span>
          </div>

          <div class="space-y-3">
            <div v-for="slot in 3" :key="`comp-slot-${slot}`">
              <p class="text-xs text-gray-500 mb-1">Comprobante {{ slot }}</p>
              <FileUploader
                :multiple="false"
                :immediate="false"
                :show-save-button="false"
                :accepted-types="['.pdf','.doc','.docx']"
                :custom-message="`Comprobante ${slot} — arrastra el archivo PDF/Word aquí o haz clic en «Subir»`"
                :initial-files="getComprobanteSlotInitial(slot - 1)"
                :model-files="pendingComprobantes[slot - 1] || []"
                @files-selected="(files) => onComprobanteSlotSelected(slot - 1, files)"
                @file-removed="(fileId) => onComprobanteSlotRemoved(slot - 1, fileId)"
                @files-cleared="() => clearComprobanteSlot(slot - 1)"
                @error="(msg) => showError('Error', msg)"
              />
            </div>
          </div>
          </div>

          <!-- Guía de Remisión -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <div class="flex items-center justify-between mb-3">
              <h2 class="font-semibold text-base">Guía de Remisión</h2>
            </div>

            <div class="space-y-3">
              <div v-for="slot in 3" :key="`guia-slot-${slot}`">
                <p class="text-xs text-gray-500 mb-1">Guía {{ slot }}</p>
                <FileUploader
                  :multiple="false"
                  :immediate="false"
                  :show-save-button="false"
                  :accepted-types="['.pdf','.doc','.docx']"
                  :custom-message="`Guía ${slot} — arrastra el archivo PDF/Word aquí o haz clic en «Subir»`"
                  :initial-files="getGuiaSlotInitial(slot - 1)"
                  :model-files="pendingGuias[slot - 1] || []"
                  @files-selected="(files) => onGuiaSlotSelected(slot - 1, files)"
                  @file-removed="(fileId) => onGuiaSlotRemoved(slot - 1, fileId)"
                  @files-cleared="() => clearGuiaSlot(slot - 1)"
                  @error="(msg) => showError('Error', msg)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Detracciones (debajo, ocupa las 2 columnas) -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold text-base">Detracciones</h2>
            <span class="text-sm text-gray-500">
              Declarado: <span class="font-semibold text-warning-600">{{ formatCurrency(totalDetracciones, 'PEN') }}</span>
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

                <!-- Sin constancia: uploader (se sube al Guardar) -->
                <div v-else class="space-y-2">
                  <FileUploader
                    :multiple="false"
                    :immediate="false"
                    :show-save-button="false"
                    :accepted-types="['.pdf','.doc','.docx']"
                    custom-message="Constancia SUNAT — arrastra el PDF/Word aquí o haz clic en «Subir» (se guarda al presionar «Guardar»)"
                    :model-files="pendingConstancias[item.id] || []"
                    @files-selected="(files) => setConstanciaFile(item.id, files)"
                    @file-removed="() => clearConstanciaFile(item.id)"
                    @files-cleared="() => clearConstanciaFile(item.id)"
                    @error="(msg) => showError('Error', msg)"
                  />
                  <div class="text-xs text-gray-400">Comprobante: {{ item.file_name }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ── Panel derecho: Estado documentos + Nota ──────────────────────── -->
      <div class="w-full lg:col-span-1 space-y-6">

        <!-- Ruta Comercial (como en diseño) -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <h2 class="font-semibold text-base mb-4">Ruta Comercial</h2>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Cotización inicial</span>
              <UButton
                v-if="panel?.cotizacion_inicial_url"
                icon="vscode-icons:file-type-pdf2"
                color="primary"
                variant="ghost"
                size="xs"
                @click="openFile(panel.cotizacion_inicial_url)"
              />
              <span v-else class="text-xs text-gray-400">—</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Cotización final</span>
              <UButton
                v-if="panel?.cotizacion_final_url"
                icon="vscode-icons:file-type-pdf2"
                color="primary"
                variant="ghost"
                size="xs"
                @click="openFile(panel.cotizacion_final_url)"
              />
              <span v-else class="text-xs text-gray-400">—</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Contrato</span>
              <UButton
                v-if="panel?.contrato_url"
                icon="vscode-icons:file-type-pdf2"
                color="primary"
                variant="ghost"
                size="xs"
                @click="openFile(panel.contrato_url)"
              />
              <span v-else class="text-xs text-gray-400">—</span>
            </div>
          </div>
        </div>

        <!-- Resumen -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-2">
          <h2 class="font-semibold text-base mb-2">Resumen</h2>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">Total comprobantes</span>
            <span class="font-semibold text-primary-600">{{ formatCurrency(totalComprobantes, 'USD') }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">Detracciones declarado</span>
            <span class="font-semibold text-warning-600">{{ formatCurrency(totalDetracciones, 'PEN') }}</span>
          </div>
          <div v-if="totalConstanciasPagadas > 0" class="flex items-center justify-between text-sm border-t border-gray-100 pt-2 mt-2">
            <span class="text-gray-500">Constancias pagadas</span>
            <span class="font-semibold text-green-600">{{ formatCurrency(totalConstanciasPagadas, 'PEN') }}</span>
          </div>
        </div>

        <!-- Nota interna -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <h2 class="font-semibold text-base mb-3">Nota interna</h2>
          <UTextarea
            v-model="nota"
            placeholder="Escribe una nota interna..."
            :rows="4"
            size="sm"
            class="w-full"
          />
        </div>

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
import { useComprobanteForm } from '~/composables/cargaconsolidada/useComprobanteForm'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import FileUploader from '~/components/commons/FileUploader.vue'
import type { FileItem } from '~/types/commons/file'
import { formatCurrency } from '~/utils/formatters'

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
  uploadComprobantesBatch,
  uploadConstancia,
  uploadConstanciasBatch,
  deleteComprobante,
  deleteConstancia,
  saveNota,
  uploadGuiasRemisionBatch,
  deleteGuiaRemision,
  deleteGuiaRemisionItem,
} = useContabilidadDetalle()

const { form: comprobanteForm, getFormByCotizacion } = useComprobanteForm()

const { showSuccess, showError, showConfirmation } = useModal()
const { withSpinner } = useSpinner()

const savingAll = ref(false)
const pendingComprobantes = ref<File[][]>([[], [], []])
const pendingGuias = ref<File[][]>([[], [], []])
const pendingConstancias = ref<Record<number, File[]>>({})

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

const getComprobanteSlotInitial = (index: number) => {
  const c = (comprobantes.value || [])[index]
  if (!c) return []
  const tipo = c.tipo_comprobante || '—'
  const montoText = c.valor_comprobante ? formatCurrency(c.valor_comprobante, 'USD') : '—'
  return [{
    id: c.id,
    file_name: `Tipo: ${tipo}   Monto: ${montoText}`,
    file_url: c.file_url,
    type: c.mime_type || 'application/pdf',
    size: c.size ?? 0,
    lastModified: Date.now(),
    file_ext: (c.file_name || '').split('.').pop() || '',
  }]
}

const getGuiaSlotInitial = (index: number) => {
  const g = guiasRemisionList.value[index]
  if (!g) return []
  return [{
    id: g.id,
    file_name: g.file_name || `Guía ${index + 1}`,
    file_url: g.file_url,
    type: 'application/pdf',
    size: g.size ?? 0,
    lastModified: Date.now(),
    file_ext: (g.file_name || '').split('.').pop() || '',
  }]
}

const formatMoney = (val: number | null | undefined) => {
  if (!val && val !== 0) return '0.00'
  return Number(val).toFixed(2)
}

const openFile = (url: string) => {
  window.open(url, '_blank')
}

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

const registeredBy = computed(() => comprobanteForm.value?.registered_by || null)
const registeredByNombre = computed(() => {
  if (comprobanteForm.value?.prefill_from_usuario_datos_facturacion) {
    return 'Tabla usuario_datos_facturación (vinculado por documento o correo)'
  }
  const rb = registeredBy.value
  if (!rb) return null
  const full = [rb.name, rb.lastname].filter(Boolean).join(' ').trim()
  return full || rb.email || null
})
const registeredByPhotoUrl = computed(() => registeredBy.value?.photo_url || null)

const goToFormularioComprobante = () => {
  if (!id || !comprobanteForm.value?.id) return
  const base = route.path.includes('/abiertos/')
    ? '/cargaconsolidada/abiertos/factura-guia/formulario-comprobante'
    : '/cargaconsolidada/completados/factura-guia/formulario-comprobante'
  navigateTo({
    path: `${base}/${id}`,
    query: { carga: String(route.query.carga || '') }
  })
}

const onComprobanteSlotSelected = (index: number, files: File[]) => {
  const next = [...pendingComprobantes.value]
  next[index] = files?.length ? [files[0]] : []
  pendingComprobantes.value = next
}
const clearComprobanteSlot = (index: number) => {
  const next = [...pendingComprobantes.value]
  next[index] = []
  pendingComprobantes.value = next
}
const onComprobanteSlotRemoved = (index: number, fileIdOrIndex: number) => {
  const initial = getComprobanteSlotInitial(index)
  if (initial.length > 0 && initial[0].id === fileIdOrIndex) {
    handleDeleteComprobante(fileIdOrIndex)
  } else {
    clearComprobanteSlot(index)
  }
}

const onGuiaSlotSelected = (index: number, files: File[]) => {
  const next = [...pendingGuias.value]
  next[index] = files?.length ? [files[0]] : []
  pendingGuias.value = next
}
const clearGuiaSlot = (index: number) => {
  const next = [...pendingGuias.value]
  next[index] = []
  pendingGuias.value = next
}
const onGuiaSlotRemoved = (index: number, fileIdOrIndex: number) => {
  const initial = getGuiaSlotInitial(index)
  if (initial.length > 0 && initial[0].id === fileIdOrIndex) {
    handleDeleteGuia(fileIdOrIndex)
  } else {
    clearGuiaSlot(index)
  }
}

const setConstanciaFile = (comprobanteId: number, files: File[]) => {
  pendingConstancias.value = { ...pendingConstancias.value, [comprobanteId]: files?.length ? [files[0]] : [] }
}
const clearConstanciaFile = (comprobanteId: number) => {
  const next = { ...pendingConstancias.value }
  delete next[comprobanteId]
  pendingConstancias.value = next
}

const handleDeleteGuia = (guiaId: number) => {
  showConfirmation(
    'Eliminar guía de remisión',
    '¿Está seguro de que desea eliminar esta guía?',
    async () => {
      await withSpinner(async () => {
        // Si es un item real (id>0) eliminar el registro individual; si no, fallback legacy (borra todas/legacy por cotización)
        const res = guiaId > 0
          ? await deleteGuiaRemisionItem(guiaId)
          : await deleteGuiaRemision(id)
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

const handleGuardarTodo = async () => {
  savingAll.value = true
  try {
    await withSpinner(async () => {
      // 1) Batch comprobantes
      const comprobanteFiles = pendingComprobantes.value.flat().filter(Boolean) as File[]
      if (comprobanteFiles.length) {
        const res = await uploadComprobantesBatch(comprobanteFiles, id)
        if (!res.success) {
          showError('Error', res.message || 'Error al subir comprobantes')
        }
      }

      // 2) Batch constancias (solo las seleccionadas)
      const constanciasItems = Object.entries(pendingConstancias.value)
        .map(([cid, files]) => ({ comprobanteId: Number(cid), file: files?.[0] }))
        .filter((x) => !!x.file)
        .map((x) => ({ comprobanteId: x.comprobanteId, file: x.file as File }))
      if (constanciasItems.length) {
        const res = await uploadConstanciasBatch(constanciasItems)
        if (!res.success) {
          showError('Error', res.message || 'Error al subir constancias')
        }
      }

      // 3) Guías por slot
      const guiaFiles = pendingGuias.value.flat().filter(Boolean) as File[]
      if (guiaFiles.length) {
        const res = await uploadGuiasRemisionBatch(id, guiaFiles)
        if (res?.success === false) {
          showError('Error', (res as any)?.message || 'Error al subir guías')
        }
      }

      // 4) Nota
      const notaRes = await saveNota(id)
      if (!notaRes.success) {
        showError('Error', notaRes.message || 'Error al guardar nota')
      }

      // refrescar
      pendingComprobantes.value = [[], [], []]
      pendingGuias.value = [[], [], []]
      pendingConstancias.value = {}
      await getDetalle(id)

      showSuccess('Guardado', 'Cambios guardados correctamente.')
    }, 'Guardando...')
  } finally {
    savingAll.value = false
  }
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

onMounted(async () => {
  await getDetalle(id)
  await getFormByCotizacion(id)
})
</script>
