<template>
  <UCard class="p-6 space-y-8">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <UButton
          icon="i-heroicons-arrow-left"
          variant="ghost"
          color="neutral"
          size="sm"
          @click="navigateTo('/basedatos/permisos')"
        />
        <div>
          <p v-if="tramiteInfo" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ tramiteInfo.entidad || '' }}
            <template v-if="tramiteInfo.tipos_permiso?.length">
              — {{ tramiteInfo.tipos_permiso.join(', ') }}
            </template>
            {{ tramiteInfo.consolidado ? `| ${tramiteInfo.consolidado}` : '' }}
          </p>
        </div>
      </div>
      <UButton
        v-if="!loading && tiposPermisoSections.length && canUpload"
        label="Guardar"
        icon="i-heroicons-check"
        size="sm"
        color="primary"
        :loading="saving"
        @click="guardarTodo"
      />
    </div>

    <!-- Skeleton loading -->
    <template v-if="loading">
      <div class="space-y-4">
        <USkeleton class="h-10 w-64 rounded-lg" />
        <div v-for="i in 3" :key="i" class="space-y-3">
          <USkeleton class="h-6 w-48" />
          <USkeleton class="h-16 w-full rounded-lg" />
        </div>
      </div>
    </template>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
      <p class="text-red-600 dark:text-red-400">{{ error }}</p>
      <UButton label="Reintentar" variant="soft" color="error" size="sm" class="mt-2" @click="loadDocumentos(tramiteId)" />
    </div>

    <template v-else>
      <!-- TABS: una pestaña por tipo de permiso -->
      <div v-if="tiposPermisoSections.length">
        <!-- Tab headers -->
        <div class="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            v-for="sec in tiposPermisoSections"
            :key="sec.id_tipo_permiso"
            class="px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors"
            :class="activeTab === sec.id_tipo_permiso
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
            @click="activeTab = sec.id_tipo_permiso"
          >
            {{ sec.nombre }}
          </button>
        </div>

        <!-- SECCIÓN 1: Documentos por trámite — FileUploader inline (Factura comercial, Ficha técnica, Fotos) -->
        <template v-for="sec in tiposPermisoSections" :key="sec.id_tipo_permiso">
          <div v-show="activeTab === sec.id_tipo_permiso" class="space-y-6">
            <UCard class="p-5">
              <div class="flex items-center justify-between gap-3 mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 class="text-lg font-bold text-gray-900 dark:text-white">1. Documentos por trámite</h2>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Factura comercial, Ficha técnica y fotos — por tipo de permiso</p>
                  </div>
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

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Documentos por categoría: FileUploader por categoría -->
                <div class="space-y-4">
                  <template v-for="cat in categoriasParaTipo(sec.id_tipo_permiso, 'documentos_tramite')" :key="cat.id">
                    <div class="space-y-1">
                      <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ cat.nombre }}:</span>
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
                  <!-- Categorías pendientes (nuevo documento): se suben al hacer "Guardar todo" -->
                  <template v-for="pending in pendingPorTipo(sec.id_tipo_permiso, 'documentos_tramite')" :key="pending.id">
                    <div class="space-y-1">
                      <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ pending.nombre }} <span class="text-amber-600 dark:text-amber-400">(pendiente)</span>:</span>
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
                  <p v-if="categoriasParaTipo(sec.id_tipo_permiso, 'documentos_tramite').length === 0 && pendingPorTipo(sec.id_tipo_permiso, 'documentos_tramite').length === 0" class="text-sm text-gray-400 italic">Sin categorías</p>
                </div>

                <!-- Fotos -->
                <div class="space-y-1">
                  <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Fotos:</span>
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
      </div>

      <!-- SECCIÓN 2: Pago servicio — global para todo el permiso (CreatePagoModal) -->
      <UCard class="p-5">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <UIcon name="i-heroicons-banknotes" class="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">2. Pago servicio</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400">Global para todo el permiso — registrar pago con voucher</p>
            </div>
          </div>
          <UButton
            v-if="canUpload"
            label="Agregar pago"
            icon="i-heroicons-plus"
            size="sm"
            color="primary"
            variant="soft"
            @click="openCreatePagoModal()"
          />
        </div>
        <div class="space-y-2">
          <p v-if="pendingPago" class="text-xs font-medium text-amber-600 dark:text-amber-400">Pago pendiente de guardar (haz clic en «Guardar» arriba para guardar todo)</p>
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Vouchers / comprobantes (clic para previsualizar):</p>
          <div class="flex flex-wrap items-start gap-2">
            <div
              v-for="doc in pagoServicio"
              :key="doc.id"
              class="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group cursor-pointer hover:ring-2 hover:ring-primary-400 transition-shadow shrink-0"
              role="button"
              tabindex="0"
              @click="openPreview(doc.url)"
              @keydown.enter="openPreview(doc.url)"
            >
              <img
                v-if="isImage(doc.extension)"
                :src="doc.url"
                :alt="doc.nombre_original"
                class="w-full h-full object-cover pointer-events-none"
              />
              <div v-else class="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 p-1 pointer-events-none">
                <UIcon name="i-heroicons-document" class="w-6 h-6 text-gray-400" />
                <span class="text-xs text-gray-400 mt-0.5 truncate w-full text-center">{{ doc.extension }}</span>
              </div>
              <div
                class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              >
                <UIcon name="i-heroicons-eye" class="w-6 h-6 text-white" />
              </div>
              <button
                v-if="canUpload"
                type="button"
                class="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs leading-none z-10"
                aria-label="Eliminar"
                @click.stop="handleDelete(doc.id)"
              >×</button>
            </div>
            <!-- Cuadrito: sin archivo → abre modal pago; con archivo → muestra preview (se envía al Guardar todo) -->
            <template v-if="canUpload">
              <div
                class="relative w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden cursor-pointer hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-center shrink-0"
                role="button"
                tabindex="0"
                @click="!pendingPago && openCreatePagoModal()"
                @keydown.enter="!pendingPago && openCreatePagoModal()"
              >
                <template v-if="pendingPago && pendingPagoPreviewUrl">
                  <img
                    v-if="pendingPagoIsImage"
                    :src="pendingPagoPreviewUrl"
                    alt="Voucher"
                    class="w-full h-full object-contain"
                  />
                  <div v-else class="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 p-1">
                    <UIcon name="i-heroicons-document" class="w-8 h-8 text-gray-500" />
                    <span class="text-xs text-gray-500 truncate w-full text-center px-1">{{ pendingPago?.voucher?.name }}</span>
                  </div>
                  <button
                    type="button"
                    class="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none z-10"
                    aria-label="Quitar"
                    @click.stop="clearPendingPago"
                  >×</button>
                </template>
                <template v-else>
                  <div class="flex flex-col items-center gap-1 text-gray-400">
                    <UIcon name="i-heroicons-plus-circle" class="w-8 h-8" />
                    <span class="text-xs">Clic para voucher</span>
                  </div>
                </template>
              </div>
              <!-- Datos del pago pendiente (monto, banco, fecha) -->
              <div v-if="pendingPago" class="flex flex-wrap items-end gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <UFormField label="Monto" class="w-24">
                  <UInput v-model="pendingPago.monto" type="number" placeholder="0" step="0.01" size="sm" />
                </UFormField>
                <UFormField label="Banco" class="w-28">
                  <USelectMenu
                    v-model="pendingPagoBancoSelected"
                    :items="[{ label: 'BCP', value: 'BCP' }, { label: 'INTERBANK', value: 'INTERBANK' }, { label: 'YAPE', value: 'YAPE' }]"
                    value-attribute="value"
                    placeholder="Banco"
                    size="sm"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="F. cierre" class="w-36">
                  <UInput v-model="pendingPagoFechaStr" type="date" size="sm" />
                </UFormField>
              </div>
            </template>
          </div>
        </div>
      </UCard>

      <!-- SECCIÓN 3: Seguimiento — Expediente/Decreto/Hoja (según pestaña activa) + RH y F. Caducidad, todo en una sola vista -->
      <UCard class="p-5">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <UIcon name="i-heroicons-clipboard-document-check" class="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">3. Seguimiento</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400">Expediente o CPB, Decreto resolutivo, Hoja resumen · RH o Factura del tramitador · F. Caducidad</p>
            </div>
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

        <div class="space-y-6">
          <!-- Expediente, Decreto, Hoja resumen -->
          <div v-if="activeSection" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div v-for="cat in categoriasSeguimientoPorTipo(activeSection.id_tipo_permiso)" :key="cat.id" class="space-y-1">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ cat.nombre }}:</span>
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
            <!-- Seguimiento pendientes (nuevo documento): se suben al hacer "Guardar todo" -->
            <div v-for="pending in pendingPorTipo(activeSection.id_tipo_permiso, 'seguimiento')" :key="pending.id" class="space-y-1">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ pending.nombre }} <span class="text-amber-600 dark:text-amber-400">(pendiente)</span>:</span>
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
          <div v-if="categoriaRH" class="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">RH o Factura del tramitador</p>
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

          <!-- F. Caducidad (por tipo de permiso de la pestaña activa) -->
          <div v-if="activeSection" class="pt-2 border-t border-gray-100 dark:border-gray-700">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">F. Caducidad ({{ activeSection.nombre }}):</span>
            <UInput
              :model-value="activeSection.f_caducidad ?? ''"
              type="date"
              size="sm"
              class="mt-1 w-40"
              :disabled="!canUpload"
              @change="(e: Event) => handleFCaducidadChange((e.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </UCard>
    </template>

    <!-- Modal Nuevo documento: crea un nuevo file para la sección y tipo_permiso actual (nombre + FileUploader) -->
    <UModal v-model:open="showNuevoDocModal">
      <template #content>
        <UCard class="p-5 space-y-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Nuevo documento</h3>
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
  </UCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useOverlay } from '#imports'
import FileUploader from '~/components/commons/FileUploader.vue'
import CreatePagoModal from '~/components/commons/CreatePagoModal.vue'
import { useTramiteDocumentos } from '~/composables/basedatos/useTramiteDocumentos'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useUserRole } from '~/composables/auth/useUserRole'
import { ROLES } from '~/constants/roles'
import { TramiteAduanaService } from '~/services/basedatos/tramiteAduanaService'
import { TramiteAduanaDocumentoService } from '~/services/basedatos/tramiteAduanaDocumentoService'
import type { TramiteCategoria, TramiteDocumento } from '~/types/basedatos/tramiteAduana'
import type { FileItem } from '~/types/commons/file'

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

const canUpload = computed(() =>
  hasRole([ROLES.COORDINACION, ROLES.DOCUMENTACION, ROLES.JEFE_IMPORTACIONES])
)

const activeTab = ref<number | null>(null)
const saving = ref(false)

/** URL de previsualización del voucher pendiente (revocar al limpiar) */
const pendingPagoPreviewUrl = ref<string | null>(null)

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

/** Pago pendiente: se registra al hacer "Guardar todo" (no al guardar en el modal) */
interface PendingPago {
  monto: string
  banco: string | string[]
  fecha: { year: number; month: number; day: number }
  voucher: File
}
const pendingPago = ref<PendingPago | null>(null)

/** Para el select de banco del pago pendiente (objeto con value para USelectMenu) */
const pendingPagoBancoSelected = computed({
  get: () => {
    const b = pendingPago.value?.banco
    const v = Array.isArray(b) ? (b[0] ?? '') : (b ?? '')
    return v ? { label: v, value: v } : null
  },
  set: (opt: { value: string } | null) => {
    if (pendingPago.value) pendingPago.value.banco = opt?.value ? [opt.value] : []
  },
})

/** Fecha del pago pendiente como string YYYY-MM-DD para input type="date" */
const pendingPagoFechaStr = computed({
  get: () => {
    const f = pendingPago.value?.fecha
    if (!f) return ''
    return `${f.year}-${String(f.month).padStart(2, '0')}-${String(f.day).padStart(2, '0')}`
  },
  set: (v: string) => {
    if (!pendingPago.value || !v) return
    const part = v.split('-')
    if (part.length !== 3) return
    pendingPago.value.fecha = {
      year: parseInt(part[0], 10),
      month: parseInt(part[1], 10),
      day: parseInt(part[2], 10),
    }
  },
})

const pendingPagoIsImage = computed(() => {
  const name = pendingPago.value?.voucher?.name ?? ''
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)
})

function clearPendingPago() {
  if (pendingPagoPreviewUrl.value) {
    URL.revokeObjectURL(pendingPagoPreviewUrl.value)
    pendingPagoPreviewUrl.value = null
  }
  pendingPago.value = null
}

function openCreatePagoModal() {
  createPagoModal.open({
    clienteNombre: tramiteInfo.value?.entidad ?? 'Trámite',
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
      if (pendingPagoPreviewUrl.value) URL.revokeObjectURL(pendingPagoPreviewUrl.value)
      pendingPagoPreviewUrl.value = URL.createObjectURL(data.voucher)
      pendingPago.value = {
        monto: data.monto,
        banco: data.banco,
        fecha: f,
        voucher: data.voucher,
      }
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

/** Categorías para un tipo y sección (desde API) */
function categoriasParaTipo(tipoId: number, seccion: 'documentos_tramite' | 'seguimiento') {
  return categorias.value.filter(c => c.id_tipo_permiso === tipoId && (c.seccion ?? 'documentos_tramite') === seccion)
}

/** Slots de seguimiento por tipo (Expediente, Decreto, Hoja) — no RH */
function categoriasSeguimientoPorTipo(tipoId: number) {
  return categorias.value.filter(c => c.seccion === 'seguimiento' && c.id_tipo_permiso === tipoId)
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

    // 3) Pago pendiente: validar y preparar para enviar en la misma petición guardar todo
    let pagoPayload: { monto: string; banco: string; fecha_cierre: string; voucher: File } | null = null
    if (pendingPago.value) {
      const p = pendingPago.value
      const bancoVal = Array.isArray(p.banco) ? (p.banco[0] ?? '') : (p.banco ?? '')
      const montoStr = p.monto != null ? String(p.monto).trim() : ''
      if (!montoStr || !bancoVal || !p.fecha?.year || !p.fecha?.month || !p.fecha?.day) {
        showError('Pago pendiente', 'Completa monto, banco y fecha de cierre del voucher pendiente.')
        return
      }
      pagoPayload = {
        monto: montoStr,
        banco: bancoVal,
        fecha_cierre: `${p.fecha.year}-${String(p.fecha.month).padStart(2, '0')}-${String(p.fecha.day).padStart(2, '0')}`,
        voucher: p.voucher,
      }
    }

    // 4) Guardar todo en una sola petición: documentos + guardar tipos + pago (si hay)
    const guardarTipos = tiposPermisoSections.value.map(sec => ({
      id_tipo_permiso: sec.id_tipo_permiso,
      documentos_tramite_ids: sec.documentos_tramite.map(d => d.id),
      fotos_ids: sec.fotos.map(d => d.id),
      seguimiento_ids: (sec.seguimiento ?? []).map(d => d.id),
      f_caducidad: sec.f_caducidad ?? undefined,
    }))
    const ok = await guardarTodoBatch(tramiteId, {
      items,
      guardarTipos,
      pago: pagoPayload,
    })
    if (!ok) {
      showError('Error al guardar', error?.value ?? 'Error al guardar')
      return
    }

    if (pagoPayload) {
      if (pendingPagoPreviewUrl.value) {
        URL.revokeObjectURL(pendingPagoPreviewUrl.value)
        pendingPagoPreviewUrl.value = null
      }
      pendingPago.value = null
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
  } catch (e: any) {
    showError('Error', e?.message ?? 'Error al guardar')
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  const confirmed = await showConfirmation(
    '¿Eliminar este documento?',
    'Esta acción no se puede deshacer.'
  )
  if (!confirmed) return
  const ok = await deleteDocumento(id)
  if (ok) showSuccess('Eliminado', 'Documento eliminado correctamente')
  else showError('Error', error.value || 'Error al eliminar')
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
    activeTab.value = tiposPermisoSections.value[0].id_tipo_permiso
  }
})
</script>
