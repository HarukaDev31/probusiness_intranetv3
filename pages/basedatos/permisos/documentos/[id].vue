<template>
  <div class="md:p-6">
    <!-- Skeleton Loading -->
    <div v-if="loading" class="max-w-6xl mx-auto space-y-6">
      <div class="flex items-center justify-between mb-6">
        <USkeleton class="h-10 w-24 rounded" />
        <USkeleton class="h-9 w-28 rounded-lg" />
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <UCard>
            <template #header>
              <USkeleton class="h-6 w-48 rounded" />
            </template>
            <div class="space-y-4">
              <div v-for="i in 3" :key="i" class="space-y-2">
                <USkeleton class="h-4 w-32 rounded" />
                <USkeleton class="h-14 w-full rounded-lg" />
              </div>
            </div>
          </UCard>
        </div>
        <div class="space-y-6">
          <UCard>
            <template #header>
              <USkeleton class="h-6 w-36 rounded" />
            </template>
            <USkeleton class="h-48 w-full rounded-lg" />
          </UCard>
          <UCard>
            <template #header>
              <USkeleton class="h-6 w-40 rounded" />
            </template>
            <USkeleton class="h-48 w-full rounded-lg" />
          </UCard>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-red-400 mx-auto mb-3" />
      <p class="text-red-600 dark:text-red-400 mb-4">{{ error }}</p>
      <UButton label="Reintentar" variant="soft" color="error" @click="loadDocumentos(tramiteId)" />
    </div>

    <!-- Contenido principal -->
    <div v-else class="max-w-6xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UButton
            icon="i-heroicons-arrow-left"
            variant="ghost"
            color="neutral"
            @click="navigateTo('/basedatos/permisos')"
          >
            Volver
          </UButton>
          <div v-if="tramiteInfo">
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ tramiteInfo.cliente || 'Sin cliente' }}
            </p>
            <p v-if="tramiteInfo.consolidado" class="text-sm text-gray-500 dark:text-gray-400">
              Carga {{ tramiteInfo.consolidado }}
            </p>
          </div>
        </div>
        <UButton
          v-if="!loading && tiposPermisoSections.length && canUpload"
          label="Guardar"
          icon="i-heroicons-check"
          color="primary"
          :loading="saving"
          @click="guardarTodo"
        />
      </div>

      <!-- Tabs -->
      <div v-if="tiposPermisoSections.length">
        <UTabs
          v-model="activeTab"
          :color="activeTab ? 'primary' : 'neutral'"
          :items="tabs"
          size="sm"
          variant="pill"
          class="mb-1 w-80 h-15"
          v-if="tabs.length > 1"
        />
      </div>

      <!-- Grid principal -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Columna izquierda: Documentos por trámite + Seguimiento -->
        <div class="lg:col-span-2 space-y-6">
          <!-- SECCIÓN 1: Documentos por trámite -->
          <template v-if="tiposPermisoSections.length">
            <template v-for="sec in tiposPermisoSections" :key="sec.id_tipo_permiso">
              <div v-show="activeTab === sec.id_tipo_permiso">
                <UCard class="bg-white dark:bg-gray-800">
                  <template #header>
                    <div class="flex items-center justify-between gap-3 flex-wrap">
                      <div class="flex items-center gap-2">
                        <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-blue-500" />
                        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Documentos por trámite</h2>
                      </div>
                      <UButton
                        v-if="canUpload"
                        label="Nuevo documento"
                        icon="i-heroicons-document-plus"
                        size="sm"
                        color="primary"
                        variant="soft"
                        @click="openNuevoDocModal('documentos_tramite', sec.id_tipo_permiso)"
                      />
                    </div>
                  </template>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-5">
                      <template v-for="cat in categoriasParaTipo(sec.id_tipo_permiso, 'documentos_tramite')" :key="cat.id">
                        <div class="space-y-1.5">
                          <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{{ cat.nombre }}</label>
                          <FileUploader
                            :ref="(el: any) => setDocUploaderRef(sec.id_tipo_permiso, cat.id, el)"
                            :multiple="false"
                            :initial-files="getDocumentosPorCategoria(sec.documentos_tramite, cat.id).map(docToFileItem)"
                            :show-save-button="!!canUpload"
                            :show-remove-button="!!canUpload"
                            :read-only="!canUpload"
                            @save-file="(file: File) => onSaveDocTramite(file, sec.id_tipo_permiso, 'documentos_tramite', cat.nombre, cat.id)"
                            @file-removed="(idOrIndex: number) => handleDelete(idOrIndex)"
                          />
                        </div>
                      </template>

                      <template v-for="pending in pendingPorTipo(sec.id_tipo_permiso, 'documentos_tramite')" :key="pending.id">
                        <div class="space-y-1.5">
                          <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {{ pending.nombre }}
                            <UBadge color="warning" variant="soft" size="xs" class="ml-1">pendiente</UBadge>
                          </label>
                          <FileUploader
                            :multiple="false"
                            :model-files="[pending.file]"
                            :show-save-button="false"
                            :show-remove-button="!!canUpload"
                            :read-only="!canUpload"
                            @file-removed="removePendingDoc(pending.id)"
                          />
                        </div>
                      </template>

                      <div v-if="categoriasParaTipo(sec.id_tipo_permiso, 'documentos_tramite').length === 0 && pendingPorTipo(sec.id_tipo_permiso, 'documentos_tramite').length === 0" class="text-center py-6">
                        <UIcon name="i-heroicons-document-minus" class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p class="text-sm text-gray-400 italic">Sin categorías</p>
                      </div>
                    </div>

                    <div class="space-y-1.5">
                      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fotos</label>
                      <FileUploader
                        :ref="(el: any) => setFotosUploaderRef(sec.id_tipo_permiso, el)"
                        :multiple="false"
                        :initial-files="sec.fotos.map(docToFileItem)"
                        :show-save-button="!!canUpload"
                        :show-remove-button="!!canUpload"
                        :read-only="!canUpload"
                        @save-file="(file: File) => uploadDocumentoTramite(file, sec.id_tipo_permiso, 'fotos', 'foto')"
                        @file-removed="(idOrIndex: number) => handleDelete(idOrIndex)"
                      />
                    </div>
                  </div>
                </UCard>
              </div>
            </template>
          </template>

          <!-- SECCIÓN 3: Seguimiento -->
          <UCard class="bg-white dark:bg-gray-800">
            <template #header>
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-clipboard-document-check" class="w-5 h-5 text-purple-500" />
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Seguimiento</h2>
                </div>
                <UButton
                  v-if="canUpload && activeSection"
                  label="Nuevo documento"
                  icon="i-heroicons-document-plus"
                  size="sm"
                  color="primary"
                  variant="soft"
                  @click="openNuevoDocModal('seguimiento', activeSection.id_tipo_permiso)"
                />
              </div>
            </template>

            <div class="space-y-6">
              <div v-if="activeSection" class="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div v-for="cat in categoriasSeguimientoPorTipo(activeSection.id_tipo_permiso)" :key="cat.id" class="space-y-1.5">
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{{ cat.nombre }}</label>
                  <FileUploader
                    :ref="(el: any) => setSegUploaderRef(activeSection.id_tipo_permiso, cat.id, el)"
                    :key="`seg-${activeSection.id_tipo_permiso}-${cat.id}-${getSeguimientoDocPorCategoria(activeSection, cat.id)?.id ?? 0}`"
                    :multiple="false"
                    :initial-files="docToFileItems(getSeguimientoDocPorCategoria(activeSection, cat.id))"
                    :show-save-button="!!canUpload"
                    :show-remove-button="!!canUpload"
                    :read-only="!canUpload"
                    @save-file="(file: File) => uploadSeguimientoSlot(file, cat.id, activeSection.id_tipo_permiso, cat.nombre)"
                    @file-removed="(idOrIndex: number) => handleDelete(idOrIndex)"
                  />
                </div>

                <div v-for="pending in pendingPorTipo(activeSection.id_tipo_permiso, 'seguimiento')" :key="pending.id" class="space-y-1.5">
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {{ pending.nombre }}
                    <UBadge color="warning" variant="soft" size="xs" class="ml-1">pendiente</UBadge>
                  </label>
                  <FileUploader
                    :multiple="false"
                    :model-files="[pending.file]"
                    :show-save-button="false"
                    :show-remove-button="!!canUpload"
                    :read-only="!canUpload"
                    @file-removed="removePendingDoc(pending.id)"
                  />
                </div>
              </div>

              <!-- RH o Factura del tramitador -->
              <div v-if="categoriaRH" class="border-t border-gray-200 dark:border-gray-700 pt-5">
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">RH o Factura del tramitador</label>
                <FileUploader
                  :ref="(el: any) => setSegUploaderRef(null, categoriaRH.id, el)"
                  :key="`seg-rh-${seguimientoCompartido.map(d => d.id).sort().join('-')}`"
                  :multiple="false"
                  :initial-files="seguimientoCompartido.map(docToFileItem)"
                  :show-save-button="!!canUpload"
                  :show-remove-button="!!canUpload"
                  :read-only="!canUpload"
                  @save-file="(file: File) => uploadSeguimientoSlot(file, categoriaRH.id, null, categoriaRH.nombre)"
                  @file-removed="(idOrIndex: number) => handleDelete(idOrIndex)"
                />
              </div>

              <!-- F. Caducidad -->
              <div v-if="activeSection" class="border-t border-gray-200 dark:border-gray-700 pt-5">
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">F. Caducidad ({{ activeSection.nombre }})</label>
                <template v-if="canUpload">
                  <UPopover class="block w-44">
                    <UButton
                      color="neutral"
                      variant="outline"
                      size="sm"
                      icon="i-heroicons-calendar-days"
                      class="w-full justify-start"
                    >
                      {{ fCaducidadDate ? dfCaducidad.format(fCaducidadDate.toDate(getLocalTimeZone())) : 'Seleccionar fecha' }}
                    </UButton>
                    <template #content>
                      <UCalendar v-model="(fCaducidadDate as any)" class="p-2 w-full" @update:model-value="onFCaducidadDateChange" />
                    </template>
                  </UPopover>
                </template>
                <p v-else class="text-sm text-gray-700 dark:text-gray-300">
                  {{ fCaducidadDate ? dfCaducidad.format(fCaducidadDate.toDate(getLocalTimeZone())) : '—' }}
                </p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Columna derecha: Pago servicio -->
        <div class="space-y-6">
          <!-- SECCIÓN 2: Pago servicio -->
          <UCard class="bg-white dark:bg-gray-800">
            <template #header>
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-banknotes" class="w-5 h-5 text-green-500" />
                  <div>
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Pago servicio</h2>
                    <p v-if="totalMontoPagoServicio !== null" class="text-sm font-semibold text-green-600 dark:text-green-400">
                      Total: S/ {{ totalMontoPagoServicio.toFixed(2) }}
                    </p>
                  </div>
                </div>
                <UButton
                  v-if="canUpload"
                  label="Agregar"
                  icon="i-heroicons-plus"
                  size="sm"
                  color="primary"
                  variant="soft"
                  @click="openCreatePagoModal()"
                />
              </div>
            </template>

            <div class="space-y-3">
              <div
                v-for="item in pagosParaMostrar"
                :key="item.document.id"
                class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/50"
              >
                <div
                  class="relative aspect-square max-h-40 w-full overflow-hidden bg-gray-100 dark:bg-gray-700 group cursor-pointer"
                  role="button"
                  tabindex="0"
                  @click="openPreviewPago(item.document)"
                  @keydown.enter="openPreviewPago(item.document)"
                >
                  <img
                    v-if="isImage(item.document.extension)"
                    :src="item.document.url"
                    :alt="item.document.nombre_original"
                    class="w-full h-full object-contain pointer-events-none"
                  />
                  <div v-else class="w-full h-full flex flex-col items-center justify-center p-2 pointer-events-none">
                    <UIcon name="i-heroicons-document" class="w-10 h-10 text-gray-400" />
                    <span class="text-xs text-gray-500 truncate w-full text-center mt-1">{{ item.document.nombre_original || item.document.extension }}</span>
                  </div>
                  <div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <UIcon name="i-heroicons-eye" class="w-6 h-6 text-white" />
                  </div>
                  <button
                    v-if="canUpload"
                    type="button"
                    class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs leading-none z-10"
                    aria-label="Eliminar"
                    @click.stop="handleDelete(item.document.id)"
                  >×</button>
                </div>

                <div class="p-3 space-y-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <template v-if="canUpload">
                    <UFormField label="Monto" size="sm">
                      <UInput v-model="getPagoEdit(item).monto" type="number" placeholder="0" step="0.01" size="sm" />
                    </UFormField>
                    <UFormField label="Banco" size="sm">
                      <USelectMenu
                        :model-value="getBancoSelectForPagoEdit(item)"
                        :items="BANCOS_OPTIONS"
                        value-attribute="value"
                        placeholder="Banco"
                        size="sm"
                        class="w-full"
                        @update:model-value="(v) => setBancoSelectForPagoEdit(item, v)"
                      />
                    </UFormField>
                    <UFormField label="F. cierre" size="sm">
                      <UInput v-model="getPagoEdit(item).fecha_cierre" type="date" size="sm" />
                    </UFormField>
                  </template>
                  <template v-else>
                    <div class="flex items-center gap-2 text-sm">
                      <span class="text-gray-500 dark:text-gray-400">Monto:</span>
                      <span class="font-medium text-gray-900 dark:text-white">{{ item.monto ?? '—' }}</span>
                    </div>
                    <div class="flex items-center gap-2 text-sm">
                      <span class="text-gray-500 dark:text-gray-400">Banco:</span>
                      <span class="font-medium text-gray-900 dark:text-white">{{ item.banco ?? '—' }}</span>
                    </div>
                    <div class="flex items-center gap-2 text-sm">
                      <span class="text-gray-500 dark:text-gray-400">F. cierre:</span>
                      <span class="font-medium text-gray-900 dark:text-white">{{ item.fecha_pago ?? '—' }}</span>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Slots de pago pendientes -->
              <template v-if="canUpload">
                <div
                  v-for="(p, idx) in pendingPagos"
                  :key="p.id"
                  class="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden"
                >
                  <div class="relative aspect-square max-h-40 w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img
                      v-if="isPendingSlotImage(p)"
                      :src="p.previewUrl!"
                      alt="Voucher"
                      class="w-full h-full object-contain"
                    />
                    <div v-else class="w-full h-full flex flex-col items-center justify-center p-2">
                      <UIcon name="i-heroicons-document" class="w-10 h-10 text-gray-400" />
                      <span class="text-xs text-gray-500 truncate w-full text-center mt-1">{{ p.voucher?.name }}</span>
                    </div>
                    <button
                      class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none z-10"
                      aria-label="Quitar"
                      @click.stop="removePendingPago(idx)"
                    >×</button>
                  </div>

                  <div class="p-3 space-y-2 bg-white dark:bg-gray-800">
                    <UFormField label="Monto" size="sm">
                      <UInput v-model="p.monto" type="number" placeholder="0" step="0.01" size="sm" />
                    </UFormField>
                    <UFormField label="Banco" size="sm">
                      <USelectMenu
                        :model-value="getPendingBancoOpt(p)"
                        :items="BANCOS_OPTIONS"
                        value-attribute="value"
                        placeholder="Banco"
                        size="sm"
                        class="w-full"
                        @update:model-value="(v) => setPendingBanco(p, v)"
                      />
                    </UFormField>
                    <UFormField label="F. cierre" size="sm">
                      <UInput :model-value="getPendingFechaStr(p)" type="date" size="sm" @update:model-value="(v) => setPendingFechaStr(p, v)" />
                    </UFormField>
                  </div>
                </div>
              </template>

              <!-- Estado vacío -->
              <div v-if="pagosParaMostrar.length === 0 && pendingPagos.length === 0" class="text-center py-8">
                <UIcon name="i-heroicons-banknotes" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p class="text-sm text-gray-500 dark:text-gray-400 italic">Sin pagos registrados</p>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Modal Nuevo documento -->
    <UModal v-model:open="showNuevoDocModal">
      <template #content>
        <UCard class="p-5 space-y-4">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Nuevo documento</h3>
          <UFormField label="Nombre del documento" required>
            <UInput v-model="nuevoDocNombre" placeholder="Ej: Factura comercial, Expediente..." />
          </UFormField>
          <UFormField label="Archivo" required>
            <FileUploader
              :multiple="false"
              :model-files="nuevoDocFile ? [nuevoDocFile] : []"
              :show-save-button="false"
              :show-remove-button="true"
              @file-added="(file: File) => { nuevoDocFile = file }"
              @file-removed="() => { nuevoDocFile = null }"
            />
          </UFormField>
          <div class="flex justify-end gap-2 pt-2">
            <UButton label="Cancelar" variant="ghost" color="neutral" @click="closeNuevoDocModal" />
            <UButton
              label="Agregar"
              color="primary"
              :disabled="!nuevoDocNombre.trim() || !nuevoDocFile"
              @click="submitNuevoDoc"
            />
          </div>
        </UCard>
      </template>
    </UModal>

    <!-- Vista previa de voucher (pago guardado) -->
    <ModalPreview
      :is-open="previewModalOpen"
      :file="previewFile"
      @close="previewModalOpen = false; previewFile = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useOverlay } from '#imports'
import FileUploader from '~/components/commons/FileUploader.vue'
import CreatePagoModal from '~/components/commons/CreatePagoModal.vue'
import ModalPreview from '~/components/commons/ModalPreview.vue'
import { useTramiteDocumentos } from '~/composables/basedatos/useTramiteDocumentos'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useUserRole } from '~/composables/auth/useUserRole'
import { ROLES } from '~/constants/roles'
import { TramiteAduanaService } from '~/services/basedatos/tramiteAduanaService'
import { TramiteAduanaDocumentoService } from '~/services/basedatos/tramiteAduanaDocumentoService'
import type { TramiteCategoria, TramiteDocumento, PagoConDatos } from '~/types/basedatos/tramiteAduana'
import type { FileItem } from '~/types/commons/file'
import { CalendarDate, getLocalTimeZone, parseDate, type DateValue } from '@internationalized/date'
import { DateFormatter } from '@internationalized/date'

definePageMeta({ layout: 'default' })

const route = useRoute()
const tramiteId = parseInt(route.params.id as string)

const {
  loading,
  uploading,
  error,
  tramiteInfo,
  categorias,
  tiposPermisoSections,
  pagoServicio,
  pagosConDatos,
  seguimientoCompartido,
  loadDocumentos,
  uploadDocumento,
  guardarTodo: guardarTodoBatch,
  deleteDocumento,
} = useTramiteDocumentos()

const { showSuccess, showError, showConfirmation } = useModal()
const { withSpinner } = useSpinner()
const { hasRole, fetchCurrentUser } = useUserRole()
const overlay = useOverlay()
const createPagoModal = overlay.create(CreatePagoModal)

/** Solo documentación, coordinación y jefe pueden subir/editar/eliminar. Otros roles: todo solo visualización; FileUploader visible solo para descargar. */
const canUpload = computed(() =>
  hasRole([ROLES.COORDINACION, ROLES.DOCUMENTACION, ROLES.JEFE_IMPORTACIONES])
)

/** Lista de pagos a mostrar: preferir pagos_con_datos del API; si no hay, usar pagoServicio con datos vacíos (retrocompat) */
const pagosParaMostrar = computed<PagoConDatos[]>(() => {
  if (pagosConDatos.value.length > 0) return pagosConDatos.value
  return pagoServicio.value.map(doc => ({
    document: doc,
    monto: null,
    fecha_pago: null,
    banco: null,
  }))
})

/** Total monto de pagos (guardados + pendientes) para mostrar junto al título */
const totalMontoPagoServicio = computed<number | null>(() => {
  let total = 0
  for (const item of pagosParaMostrar.value) {
    const m = item.monto != null && item.monto !== '' ? parseFloat(String(item.monto)) : NaN
    if (!Number.isNaN(m)) total += m
  }
  for (const p of pendingPagos.value) {
    const m = p.monto != null && p.monto !== '' ? parseFloat(String(p.monto)) : NaN
    if (!Number.isNaN(m)) total += m
  }
  return total > 0 ? total : null
})

/** Edición de datos de cada pago (monto, banco, fecha); se envían en Guardar todo */
const pagoEdits = ref<Record<number, { monto: string; banco: string; fecha_cierre: string }>>({})
function getPagoEdit(item: PagoConDatos) {
  const id = item.document.id
  if (!(id in pagoEdits.value)) {
    pagoEdits.value[id] = {
      monto: item.monto ?? '',
      banco: item.banco ?? '',
      fecha_cierre: item.fecha_pago ?? '',
    }
  }
  return pagoEdits.value[id]
}

const BANCOS_OPTIONS = [{ label: 'BCP', value: 'BCP' }, { label: 'INTERBANK', value: 'INTERBANK' }, { label: 'YAPE', value: 'YAPE' }]
function getBancoSelectForPagoEdit(item: PagoConDatos) {
  const v = getPagoEdit(item).banco || ''
  return BANCOS_OPTIONS.find(o => o.value === v) || (v ? { label: v, value: v } : null)
}
function setBancoSelectForPagoEdit(item: PagoConDatos, opt: { value: string } | null) {
  getPagoEdit(item).banco = opt?.value ?? ''
}

const activeTab = ref<number | null>(null)
const tabs = computed(() =>
  tiposPermisoSections.value.map(sec => ({
    label: sec.nombre,
    value: sec.id_tipo_permiso,
  }))
)
const saving = ref(false)


/** Modal de vista previa (pagos guardados): abrir con doc al hacer clic en la imagen */
const previewModalOpen = ref(false)
const previewFile = ref<FileItem | null>(null)

/** Refs a FileUploader por categoría (Documentos por trámite) — getFiles() y clearSelectedFiles() al guardar */
const docUploaderRefs = ref<Record<string, { getFiles: () => File[]; clearSelectedFiles: () => void }>>({})
function setDocUploaderRef(tipoId: number, catId: number, el: any) {
  const key = `${tipoId}-${catId}`
  const comp = Array.isArray(el) ? el[0] : el
  if (comp && typeof comp.getFiles === 'function') {
    docUploaderRefs.value[key] = {
      getFiles: () => comp.getFiles() ?? [],
      clearSelectedFiles: () => comp.clearSelectedFiles?.()
    }
  } else {
    delete docUploaderRefs.value[key]
  }
}

/** Refs a FileUploader de Fotos por tipo_permiso */
const fotosUploaderRefs = ref<Record<number, { getFiles: () => File[]; clearSelectedFiles: () => void }>>({})
function setFotosUploaderRef(tipoId: number, el: any) {
  const comp = Array.isArray(el) ? el[0] : el
  if (comp && typeof comp.getFiles === 'function') {
    fotosUploaderRefs.value[tipoId] = {
      getFiles: () => comp.getFiles() ?? [],
      clearSelectedFiles: () => comp.clearSelectedFiles?.()
    }
  } else {
    delete fotosUploaderRefs.value[tipoId]
  }
}

/** Refs a FileUploader de Seguimiento (Expediente, Decreto, Hoja por tipo; RH compartido). Key: seg-{tipoId}-{catId} o rh-{catId} */
const segUploaderRefs = ref<Record<string, { getFiles: () => File[]; clearSelectedFiles: () => void }>>({})
function setSegUploaderRef(tipoId: number | null, catId: number, el: any) {
  const key = tipoId === null ? `rh-${catId}` : `seg-${tipoId}-${catId}`
  const comp = Array.isArray(el) ? el[0] : el
  if (comp && typeof comp.getFiles === 'function') {
    segUploaderRefs.value[key] = {
      getFiles: () => comp.getFiles() ?? [],
      clearSelectedFiles: () => comp.clearSelectedFiles?.()
    }
  } else {
    delete segUploaderRefs.value[key]
  }
}

/** Sección del tipo de permiso de la pestaña activa (para Seguimiento debajo de Pago servicio) */
const activeSection = computed(() =>
  tiposPermisoSections.value.find(s => s.id_tipo_permiso === activeTab.value) ?? null
)

/** F. Caducidad: date picker (Nuxt UI Calendar) */
const dfCaducidad = new DateFormatter('es-ES', { dateStyle: 'short' })
function parseFechaCaducidad(s: string | null | undefined): CalendarDate | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  try {
    return parseDate(s) as CalendarDate
  } catch {
    return null
  }
}
function calendarDateToYMD(d: CalendarDate): string {
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
}
const fCaducidadDate = ref<DateValue | null>(null)
watch(activeSection, (sec) => {
  fCaducidadDate.value = parseFechaCaducidad(sec?.f_caducidad ?? '')
}, { immediate: true })
function onFCaducidadDateChange(d: DateValue | null) {
  if (!d) return
  handleFCaducidadChange(calendarDateToYMD(d as CalendarDate))
}

/** Modal Nuevo documento: nuevo file para esa sección y ese tipo_permiso (sin selector de categoría) */
const showNuevoDocModal = ref(false)
const nuevoDocSection = ref<'documentos_tramite' | 'seguimiento'>('documentos_tramite')
const nuevoDocTipoPermisoId = ref<number | null>(null)
const nuevoDocNombre = ref('')
const nuevoDocFile = ref<File | null>(null)

/** Documentos nuevos pendientes de subir (se suben al hacer "Guardar todo") */
interface PendingNewDoc {
  id: number
  section: 'documentos_tramite' | 'seguimiento'
  idTipoPermiso: number
  nombre: string
  file: File
  idCategoria?: number
}
const pendingNewDocId = ref(0)
const pendingNewDocs = ref<PendingNewDoc[]>([])

/** Slots de pago pendientes: cada uno se guarda al hacer "Guardar todo" */
interface PendingPagoSlot {
  id: number
  monto: string
  banco: string
  fecha: { year: number; month: number; day: number }
  voucher: File
  previewUrl: string | null
}
const pendingPagoSlotId = ref(0)
const pendingPagos = ref<PendingPagoSlot[]>([])

function getPendingBancoOpt(p: PendingPagoSlot) {
  const v = p.banco || ''
  return BANCOS_OPTIONS.find(o => o.value === v) || (v ? { label: v, value: v } : null)
}
function setPendingBanco(p: PendingPagoSlot, opt: { value: string } | null) {
  p.banco = opt?.value ?? ''
}
function getPendingFechaStr(p: PendingPagoSlot) {
  const f = p.fecha
  if (!f) return ''
  return `${f.year}-${String(f.month).padStart(2, '0')}-${String(f.day).padStart(2, '0')}`
}
function setPendingFechaStr(p: PendingPagoSlot, v: string) {
  if (!v) return
  const part = v.split('-')
  if (part.length !== 3) return
  p.fecha = {
    year: parseInt(part[0], 10),
    month: parseInt(part[1], 10),
    day: parseInt(part[2], 10),
  }
}
function isPendingSlotImage(p: PendingPagoSlot) {
  const name = p.voucher?.name ?? ''
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)
}

function removePendingPago(idx: number) {
  const p = pendingPagos.value[idx]
  if (p?.previewUrl) URL.revokeObjectURL(p.previewUrl)
  pendingPagos.value.splice(idx, 1)
}

function openCreatePagoModal() {
  createPagoModal.open({
    clienteNombre: tramiteInfo.value?.cliente ?? tramiteInfo.value?.entidad ?? 'Trámite',
    currency: 'PEN',
    onSave: (data: { monto: string; banco: string | string[]; fecha: { year: number; month: number; day: number }; voucher: File | null }) => {
      if (!data.voucher) {
        showError('Error', 'Debe adjuntar el voucher')
        return
      }
      const f = data.fecha && typeof data.fecha === 'object' && 'year' in data.fecha && 'month' in data.fecha && 'day' in data.fecha
        ? { year: Number((data.fecha as any).year), month: Number((data.fecha as any).month), day: Number((data.fecha as any).day) }
        : null
      if (!f || !f.year || !f.month || !f.day) {
        showError('Error', 'Selecciona la fecha de cierre')
        return
      }
      const bancoVal = Array.isArray(data.banco) ? (data.banco[0] ?? '') : (data.banco ?? '')
      pendingPagoSlotId.value += 1
      pendingPagos.value.push({
        id: pendingPagoSlotId.value,
        monto: data.monto,
        banco: bancoVal,
        fecha: f,
        voucher: data.voucher,
        previewUrl: URL.createObjectURL(data.voucher),
      })
      createPagoModal.close()
    },
  })
}

function openNuevoDocModal(section: 'documentos_tramite' | 'seguimiento', tipoPermisoId: number) {
  nuevoDocSection.value = section
  nuevoDocTipoPermisoId.value = tipoPermisoId
  nuevoDocNombre.value = ''
  nuevoDocFile.value = null
  showNuevoDocModal.value = true
}

function closeNuevoDocModal() {
  showNuevoDocModal.value = false
}

/** Agregar a pendientes (no sube hasta "Guardar todo") */
function submitNuevoDoc() {
  if (!nuevoDocFile.value || !nuevoDocNombre.value.trim()) return
  const nombre = nuevoDocNombre.value.trim()
  const tipoId = nuevoDocTipoPermisoId.value!

  if (nuevoDocSection.value === 'documentos_tramite') {
    pendingNewDocs.value.push({
      id: ++pendingNewDocId.value,
      section: 'documentos_tramite',
      idTipoPermiso: tipoId,
      nombre,
      file: nuevoDocFile.value,
    })
    closeNuevoDocModal()
    return
  }

  if (nuevoDocSection.value === 'seguimiento') {
    const cats = categoriasSeguimientoPorTipo(tipoId)
    const idCategoria = cats[0]?.id
    if (idCategoria == null) {
      showError('Error', 'No hay categorías de seguimiento para este tipo')
      return
    }
    pendingNewDocs.value.push({
      id: ++pendingNewDocId.value,
      section: 'seguimiento',
      idTipoPermiso: tipoId,
      nombre,
      file: nuevoDocFile.value,
      idCategoria,
    })
    closeNuevoDocModal()
  }
}

function pendingPorTipo(tipoId: number, section: 'documentos_tramite' | 'seguimiento') {
  return pendingNewDocs.value.filter(p => p.idTipoPermiso === tipoId && p.section === section)
}

function removePendingDoc(pendingId: number) {
  pendingNewDocs.value = pendingNewDocs.value.filter(p => p.id !== pendingId)
}

/** Categorías para un tipo y sección (desde API), ordenadas por id */
function categoriasParaTipo(tipoId: number, seccion: 'documentos_tramite' | 'seguimiento') {
  return categorias.value
    .filter(c => c.id_tipo_permiso === tipoId && (c.seccion ?? 'documentos_tramite') === seccion)
    .slice()
    .sort((a, b) => a.id - b.id)
}

/** Slots de seguimiento por tipo (Expediente, Decreto, Hoja) — no RH, ordenados por id */
function categoriasSeguimientoPorTipo(tipoId: number) {
  return categorias.value
    .filter(c => c.seccion === 'seguimiento' && c.id_tipo_permiso === tipoId)
    .slice()
    .sort((a, b) => a.id - b.id)
}

/** Categoría RH compartida */
const categoriaRH = computed(() =>
  categorias.value.find(c => c.seccion === 'seguimiento' && c.id_tipo_permiso == null) ?? null
)

function getDocumentosPorCategoria(docs: TramiteDocumento[], catId: number): TramiteDocumento[] {
  return docs.filter(d => d.id_categoria === catId)
}

function getSeguimientoDocPorCategoria(sec: { seguimiento?: TramiteDocumento[] }, catId: number): TramiteDocumento | null {
  return (sec.seguimiento ?? []).find(d => d.id_categoria === catId) ?? null
}

function docToFileItem(doc: TramiteDocumento): FileItem {
  return {
    id: doc.id,
    file_name: doc.nombre_original,
    file_url: doc.url,
    type: doc.extension || '',
    size: doc.peso ?? 0,
    lastModified: 0,
    file_ext: doc.extension || '',
  }
}

function docToFileItems(doc: TramiteDocumento | null): FileItem[] {
  return doc ? [docToFileItem(doc)] : []
}

async function onSaveDocTramite(
  file: File,
  tipoPermisoId: number,
  seccion: 'documentos_tramite' | 'fotos',
  nombre: string,
  idCategoria?: number
): Promise<void> {
  const ok = await uploadDocumento(
    tramiteId,
    seccion,
    nombre,
    file,
    idCategoria,
    seccion,
    tipoPermisoId
  )
  if (ok) {
    showSuccess('Subido', 'Archivo subido correctamente')
    if (idCategoria != null) {
      docUploaderRefs.value[`${tipoPermisoId}-${idCategoria}`]?.clearSelectedFiles?.()
    }
  } else {
    showError('Error', error.value || 'Error al subir el archivo')
  }
}

async function uploadDocumentoTramite(
  file: File,
  tipoPermisoId: number,
  seccion: 'documentos_tramite' | 'fotos',
  nombre: string,
  idCategoria?: number
): Promise<boolean> {
  const ok = await uploadDocumento(
    tramiteId,
    seccion,
    nombre,
    file,
    idCategoria,
    seccion,
    tipoPermisoId
  )
  if (ok) showSuccess('Subido', 'Archivo subido correctamente')
  else showError('Error', error.value || 'Error al subir el archivo')
  return ok
}

async function uploadSeguimientoSlot(file: File, idCategoria: number, idTipoPermiso: number | null, nombre: string): Promise<boolean> {
  const ok = await uploadDocumento(
    tramiteId,
    'seguimiento',
    nombre,
    file,
    idCategoria,
    'seguimiento',
    idTipoPermiso ?? undefined
  )
  if (ok) showSuccess('Subido', 'Archivo subido correctamente')
  else showError('Error', error.value || 'Error al subir el archivo')
  return ok
}

function openPreview(url: string) {
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}

function openPreviewPago(doc: TramiteDocumento) {
  if (!doc?.url) return
  previewFile.value = {
    id: doc.id,
    file_url: doc.url,
    file_name: doc.nombre_original || `documento.${doc.extension || 'pdf'}`,
    type: '',
    size: doc.peso ?? 0,
    lastModified: 0,
    file_ext: doc.extension || '',
  }
  previewModalOpen.value = true
}

function isImage(ext: string) {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes((ext || '').toLowerCase())
}

async function guardarTodo() {
  saving.value = true
  try {
    await nextTick()
    type BatchItem = { idTipoPermiso: number; file: File; seccion: 'documentos_tramite' | 'fotos' | 'seguimiento'; idCategoria: number; categoria: string }
    const items: BatchItem[] = []
    const pendingIdsToRemove: number[] = []

    // 1) Recolectar archivos de FileUploaders (documentos por categoría y fotos)
    for (const sec of tiposPermisoSections.value) {
      for (const cat of categoriasParaTipo(sec.id_tipo_permiso, 'documentos_tramite')) {
        const uploader = docUploaderRefs.value[`${sec.id_tipo_permiso}-${cat.id}`]
        const files = uploader?.getFiles() ?? []
        for (const file of files) {
          items.push({
            idTipoPermiso: sec.id_tipo_permiso,
            file,
            seccion: 'documentos_tramite',
            idCategoria: cat.id,
            categoria: cat.nombre,
          })
        }
      }
      const fotosFiles = fotosUploaderRefs.value[sec.id_tipo_permiso]?.getFiles() ?? []
      for (const file of fotosFiles) {
        items.push({
          idTipoPermiso: sec.id_tipo_permiso,
          file,
          seccion: 'fotos',
          idCategoria: -1,
          categoria: 'foto',
        })
      }
      // Seguimiento por tipo (Expediente, Decreto, Hoja resumen)
      for (const cat of categoriasSeguimientoPorTipo(sec.id_tipo_permiso)) {
        const segFiles = segUploaderRefs.value[`seg-${sec.id_tipo_permiso}-${cat.id}`]?.getFiles() ?? []
        for (const file of segFiles) {
          items.push({
            idTipoPermiso: sec.id_tipo_permiso,
            file,
            seccion: 'seguimiento',
            idCategoria: cat.id,
            categoria: cat.nombre,
          })
        }
      }
    }
    // Seguimiento RH (compartido): idTipoPermiso 0 para que el backend guarde null
    const rh = categoriaRH.value
    if (rh) {
      const rhFiles = segUploaderRefs.value[`rh-${rh.id}`]?.getFiles() ?? []
      for (const file of rhFiles) {
        items.push({
          idTipoPermiso: 0,
          file,
          seccion: 'seguimiento',
          idCategoria: rh.id,
          categoria: rh.nombre,
        })
      }
    }

    // 2) Recolectar pendientes (nuevo documento)
    for (const pending of pendingNewDocs.value) {
      if (pending.section === 'documentos_tramite') {
        items.push({
          idTipoPermiso: pending.idTipoPermiso,
          file: pending.file,
          seccion: 'documentos_tramite',
          idCategoria: -1,
          categoria: pending.nombre,
        })
        pendingIdsToRemove.push(pending.id)
      } else if (pending.section === 'seguimiento' && pending.idCategoria != null) {
        items.push({
          idTipoPermiso: pending.idTipoPermiso,
          file: pending.file,
          seccion: 'seguimiento',
          idCategoria: pending.idCategoria,
          categoria: pending.nombre,
        })
        pendingIdsToRemove.push(pending.id)
      }
    }

    // 3) Pagos pendientes: validar y preparar array para enviar en la misma petición guardar todo
    const pagosPayload: Array<{ monto: string; banco: string; fecha_cierre: string; voucher: File }> = []
    for (const p of pendingPagos.value) {
      const montoStr = p.monto != null ? String(p.monto).trim() : ''
      const bancoStr = String(p.banco ?? '').trim()
      if (!montoStr || !bancoStr || !p.fecha?.year || !p.fecha?.month || !p.fecha?.day) {
        showError('Pago pendiente', 'Completa monto, banco y fecha de cierre en todos los vouchers pendientes.')
        return
      }
      pagosPayload.push({
        monto: montoStr,
        banco: bancoStr,
        fecha_cierre: `${p.fecha.year}-${String(p.fecha.month).padStart(2, '0')}-${String(p.fecha.day).padStart(2, '0')}`,
        voucher: p.voucher,
      })
    }

    // 4) Guardar todo en una sola petición: documentos + guardar tipos + pagos (si hay)
    const guardarTipos = tiposPermisoSections.value.map(sec => ({
      id_tipo_permiso: sec.id_tipo_permiso,
      documentos_tramite_ids: sec.documentos_tramite.map(d => d.id),
      fotos_ids: sec.fotos.map(d => d.id),
      seguimiento_ids: (sec.seguimiento ?? []).map(d => d.id),
      f_caducidad: sec.f_caducidad ?? undefined,
    }))
    const pagoActualizaciones = pagosParaMostrar.value.map(item => {
      const edit = getPagoEdit(item)
      return {
        id_documento: item.document.id,
        monto: String(edit.monto ?? '').trim(),
        banco: String(edit.banco ?? '').trim(),
        fecha_cierre: String(edit.fecha_cierre ?? '').trim(),
      }
    })
    const ok = await guardarTodoBatch(tramiteId, {
      items,
      guardarTipos,
      pagos: pagosPayload.length ? pagosPayload : undefined,
      pagoActualizaciones: pagoActualizaciones.length ? pagoActualizaciones : undefined,
    })
    if (!ok) {
      showError('Error al guardar', error?.value ?? 'Error al guardar')
      return
    }

    if (pagosPayload.length) {
      for (const p of pendingPagos.value) {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl)
      }
      pendingPagos.value = []
    }

    for (const sec of tiposPermisoSections.value) {
      for (const cat of categoriasParaTipo(sec.id_tipo_permiso, 'documentos_tramite')) {
        docUploaderRefs.value[`${sec.id_tipo_permiso}-${cat.id}`]?.clearSelectedFiles()
      }
      fotosUploaderRefs.value[sec.id_tipo_permiso]?.clearSelectedFiles()
      for (const cat of categoriasSeguimientoPorTipo(sec.id_tipo_permiso)) {
        segUploaderRefs.value[`seg-${sec.id_tipo_permiso}-${cat.id}`]?.clearSelectedFiles()
      }
    }
    if (categoriaRH.value) {
      segUploaderRefs.value[`rh-${categoriaRH.value.id}`]?.clearSelectedFiles()
    }
    pendingNewDocs.value = pendingNewDocs.value.filter(p => !pendingIdsToRemove.includes(p.id))

    showSuccess('Guardado', 'Datos de todos los tabs guardados correctamente')
    await loadDocumentos(tramiteId)
    pagoEdits.value = {}
  } catch (e: any) {
    showError('Error', e?.message ?? 'Error al guardar')
  } finally {
    saving.value = false
  }
}

function handleDelete(id: number) {
  showConfirmation(
    '¿Eliminar este documento?',
    'Esta acción no se puede deshacer.',
    async () => {
      const ok = await deleteDocumento(id)
      if (ok) showSuccess('Eliminado', 'Documento eliminado correctamente')
      else showError('Error', error.value || 'Error al eliminar')
    }
  )
}

function handleFCaducidadChange(value: string) {
  if (!canUpload.value || !activeSection.value) return
  const id = activeSection.value.id_tipo_permiso
  tiposPermisoSections.value = tiposPermisoSections.value.map(s =>
    s.id_tipo_permiso === id ? { ...s, f_caducidad: value || null } : s
  )
}

onMounted(async () => {
  fetchCurrentUser()
  await loadDocumentos(tramiteId)
  if (tiposPermisoSections.value.length) {
    const tabQuery = route.query.tab
    const tabId = typeof tabQuery === 'string' ? parseInt(tabQuery, 10) : NaN
    if (Number.isInteger(tabId) && tiposPermisoSections.value.some(s => s.id_tipo_permiso === tabId)) {
      activeTab.value = tabId
    } else {
      activeTab.value = tiposPermisoSections.value[0].id_tipo_permiso
    }
  }
})
</script>
