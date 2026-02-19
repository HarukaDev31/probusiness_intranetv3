<template>
  <div class="p-6 max-w-5xl mx-auto">
    <div class="flex flex-wrap justify-between items-center gap-4 mb-6">
      <UButton icon="i-heroicons-arrow-left" color="neutral" variant="ghost" @click="navigateTo('/verificacion?tab=permisos')">
        Regresar
      </UButton>
      <div class="flex items-center gap-3">
        <p v-if="hasPendientes" class="text-sm text-amber-600 dark:text-amber-400 hidden sm:block">
          Hay cambios sin guardar. Haz clic en Guardar para enviar.
        </p>
        <UButton
          icon="i-heroicons-check"
          color="primary"
          :loading="saving"
          :disabled="!isAdministracion"
          @click="handleSave"
        >
          Guardar
        </UButton>
      </div>
    </div>

    <!-- Resumen -->
    <div class="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div class="text-lg font-semibold text-gray-900 dark:text-white flex flex-row justify-between flex-wrap gap-2">
        <span>{{ tramite?.cliente?.nombre || 'Permiso' }}</span>
        <div class="flex gap-4">
          <span>Importe: <span class="text-primary-600">{{ formatCurrency(totalImporte, 'PEN') }}</span></span>
          <span>Pagado: <span class="text-primary-600">{{ formatCurrency(totalPagado, 'PEN') }}</span></span>
        </div>
      </div>
    </div>

    <!-- 1. Verificación pagos de servicio -->
    <section class="mb-8">
      <div class="flex items-center gap-2 mb-4">
        <UIcon name="i-heroicons-banknotes" class="w-5 h-5 text-primary-500" />
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Importe servicio</h2>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Verifica el estado de cada pago (Conforme / Pendiente / Observado). Solo se guarda al hacer clic en <strong>Guardar</strong> arriba.
      </p>
      <div v-if="loading" class="animate-pulse h-24 bg-gray-200 dark:bg-gray-700 rounded" />
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="(pago, idx) in pagosConDatos"
          :key="pago.document?.id ?? idx"
          class="rounded-lg border p-4 transition-colors duration-200"
          :class="cardClassByEstado(estadosServicio[idx])"
        >
          <h4 class="font-medium text-gray-900 dark:text-white mb-2">Servicio</h4>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Monto:</span>
              <span class="font-medium">{{ formatCurrency(parseFloat(pago.monto || '0'), 'PEN') }}</span>
            </div>
            <div class="flex justify-between" v-if="pago.fecha_pago">
              <span class="text-gray-600 dark:text-gray-400">Fecha:</span>
              <span class="font-medium">{{ formatDateTimeToDmy(pago.fecha_pago) }}</span>
            </div>
            <div class="flex justify-between" v-if="pago.banco">
              <span class="text-gray-600 dark:text-gray-400">Banco:</span>
              <span class="font-medium">{{ pago.banco }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600 dark:text-gray-400">Voucher:</span>
              <button
                v-if="pago.document?.url"
                type="button"
                class="text-xs text-primary-600 hover:underline truncate max-w-28"
                @click="openPreview(pago.document.url, pago.document.nombre_original)"
              >
                {{ pago.document.nombre_original || 'Ver' }}
              </button>
              <span v-else class="text-xs text-gray-500">Sin comprobante</span>
            </div>
          </div>
          <div class="mt-3">
            <USelect
              v-if="isAdministracion"
              v-model="estadosServicio[idx]"
              :items="estadosOptions"
              placeholder="Conforme"
              size="sm"
              @update:model-value="(val) => onEstadoServicioChange(idx, val)"
            />
            <span
              v-else
              class="inline-flex px-2 py-1 rounded text-xs font-medium"
              :class="estadoServicioBadgeClass(estadosServicio[idx])"
            >
              {{ estadoServicioLabel(estadosServicio[idx]) }}
            </span>
          </div>
        </div>
        <div v-if="!loading && (!pagosConDatos || pagosConDatos.length === 0)" class="col-span-full text-sm text-gray-500">
          No hay pagos de servicio registrados.
        </div>
      </div>
    </section>

    <!-- 2. Derecho trámite x tipo_permiso -->
    <section class="mb-8">
      <div class="flex items-center gap-2 mb-4">
        <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-primary-500" />
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Derecho trámite</h2>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Expediente o CPB se cargan desde Documentación. Aquí solo puedes subir <strong>Comprobantes</strong> (voucher de pago).
      </p>
      <div v-if="loading" class="animate-pulse h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="tipo in tramite?.tipos_permiso ?? []"
          :key="tipo.id"
          class="rounded-xl border p-4 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <!-- Monto, Entidad, T. Permiso, Pagado comprobantes -->
          <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-4">
            <div>
              <span class="text-gray-500 dark:text-gray-400">Monto</span>
              <p class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(Number(tipo.derecho_entidad || 0), 'PEN') }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Entidad</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ tramite?.entidad?.nombre ?? '-' }}</p>
            </div>
            <div class="col-span-2">
              <span class="text-gray-500 dark:text-gray-400">T. Permiso</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ tipo.nombre_permiso }}</p>
            </div>
            <div class="col-span-2">
              <span class="text-gray-500 dark:text-gray-400">Pagado </span>
              <p class="font-semibold text-primary-600 dark:text-primary-400">{{ formatCurrency(totalPagadoDerechoByTipo[tipo.id] || 0, 'PEN') }}</p>
            </div>
          </div>

          <!-- Expediente o CPB: solo lectura con FileUploader (desde Documentación) -->
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Expediente o CPB <span class="italic">(desde Documentación)</span></p>
          <FileUploader
            v-if="docToFileItems(getDocumentosTipo(tipo.id)).length > 0"
            :initial-files="docToFileItems(getDocumentosTipo(tipo.id))"
            :read-only="true"
            :show-save-button="false"
            :show-remove-button="false"
          />
          <p v-else class="text-sm text-gray-400 dark:text-gray-500 py-2">Se cargan desde Documentación</p>

          <!-- Comprobantes: guardados (tabla pagos_permiso_derecho_tramite) + subir más -->
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-4 mb-2">Comprobantes <span class="italic">(subir aquí)</span></p>
          <div class="flex flex-wrap items-center gap-2">
            <!-- Comprobantes ya guardados: clic abre modal edición -->
            <template v-for="c in (comprobantesDerechoPorTipo[tipo.id] || [])" :key="c.id">
              <div class="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 min-w-0">
                <button
                  type="button"
                  class="flex items-center gap-2 min-w-0 flex-1 text-left"
                  @click="openEditDerecho(tipo, c)"
                >
                  <img
                    v-if="c.url && isImageUrl(c.url)"
                    :src="c.url"
                    alt="Preview"
                    class="w-12 h-12 object-cover rounded flex-shrink-0"
                  />
                  <div v-else class="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <UIcon name="i-heroicons-document" class="w-6 h-6 text-primary-500" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-xs text-gray-500">Monto: {{ formatCurrency(parseFloat(comprobantesEditsDerecho[c.id]?.monto ?? c.monto ?? '0') || 0, 'PEN') }}</p>
                    <p class="text-xs text-gray-500">Banco: {{ comprobantesEditsDerecho[c.id]?.banco ?? c.banco ?? '-' }}</p>
                    <p class="text-xs text-gray-500">Fecha: {{ formatDateTimeToDmy(comprobantesEditsDerecho[c.id]?.fecha_cierre ?? c.fecha_cierre ?? '') || '-' }}</p>
                  </div>
                </button>
                <UButton
                  v-if="isAdministracion"
                  icon="i-heroicons-trash"
                  color="error"
                  variant="ghost"
                  size="xs"
                  title="Eliminar comprobante"
                  @click.stop="confirmarEliminarComprobanteDerecho(tipo.id, c.id)"
                />
              </div>
            </template>
            <!-- Pendientes: varios por tipo, con preview -->
            <template v-for="(pend, idx) in (pendingPagosDerecho[tipo.id] || [])" :key="'pend-' + tipo.id + '-' + idx">
              <div class="flex items-center gap-2 p-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50/50 dark:bg-gray-800 min-w-0">
                <img
                  v-if="isImageFile(pend.voucher)"
                  :src="getPendingFilePreviewUrl(tipo.id, idx)"
                  alt="Vista previa"
                  class="w-12 h-12 object-cover rounded flex-shrink-0"
                />
                <div v-else class="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <UIcon name="i-heroicons-document" class="w-6 h-6 text-gray-500" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-xs text-gray-500">Monto: {{ formatCurrency(parseFloat(pend.monto || '0') || 0, 'PEN') }}</p>
                  <p class="text-xs text-gray-500">Banco: {{ pend.banco || '-' }}</p>
                  <p class="text-xs text-gray-500">Fecha: {{ formatDateTimeToDmy(pend.fecha_cierre) || '-' }}</p>
                  <p class="text-xs text-amber-600 dark:text-amber-400">Pendiente de guardar</p>
                </div>
                <UButton
                  v-if="isAdministracion"
                  icon="i-heroicons-x-mark"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  title="Quitar"
                  @click.stop="quitarPendienteDerecho(tipo.id, idx)"
                />
              </div>
            </template>
            <button
              type="button"
              class="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 flex items-center justify-center flex-shrink-0 transition-colors"
              @click="openModalDerechoTramite(tipo)"
              title="Subir comprobante"
            >
              <UIcon name="i-heroicons-plus" class="w-7 h-7 text-gray-400" />
            </button>
          </div>

          <!-- Estado -->
          <div class="mt-4">
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
              :class="(totalPagadoDerechoByTipo[tipo.id] || 0) >= Number(tipo.derecho_entidad || 0) ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'"
            >
              <UIcon :name="(totalPagadoDerechoByTipo[tipo.id] || 0) >= Number(tipo.derecho_entidad || 0) ? 'i-heroicons-check-circle' : 'i-heroicons-clock'" class="w-4 h-4" />
              {{ (totalPagadoDerechoByTipo[tipo.id] || 0) >= Number(tipo.derecho_entidad || 0) ? 'Pagado' : 'Pendiente' }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Tramitador -->
    <section class="mb-8">
      <div class="flex items-center gap-2 mb-4">
        <UIcon name="i-heroicons-user-circle" class="w-5 h-5 text-primary-500" />
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Tramitador</h2>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        RH o Factura se carga desde Documentación. Aquí solo puedes subir <strong>Comprobantes</strong> del tramitador.
      </p>
      <div v-if="loading" class="animate-pulse h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      <div
        v-else
        class="rounded-xl border p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div class="font-medium text-gray-900 dark:text-white">RH o Factura</div>
            <div class="text-sm text-gray-500">Compartido por permiso</div>
          </div>
          <div class="flex items-center gap-3 text-sm">
            <span>Monto: <strong>{{ formatCurrency(Number(tramite?.tramitador || 0), 'PEN') }}</strong></span>
            <span>Pagado : <strong class="text-primary-600 dark:text-primary-400">{{ formatCurrency(totalPagadoTramitador, 'PEN') }}</strong></span>
          </div>
        </div>
        <!-- RH o Factura: solo lectura con FileUploader (desde Documentación) -->
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-4 mb-2">RH o Factura <span class="italic">(desde Documentación)</span></p>
        <FileUploader
          v-if="docToFileItems(seguimientoCompartido).length > 0"
          :initial-files="docToFileItems(seguimientoCompartido)"
          :read-only="true"
          :show-save-button="false"
          :show-remove-button="false"
        />
        <p v-else class="text-sm text-gray-400 dark:text-gray-500 py-2">Se cargan desde Documentación</p>
        <!-- Comprobantes tramitador: guardados (tabla pagos_permiso_tramite) + subir más -->
        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subir comprobantes</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Usa el botón para abrir el modal y adjuntar el comprobante de pago del tramitador.</p>
          <div class="flex flex-wrap items-center gap-2">
            <!-- Comprobantes ya guardados: clic abre modal edición -->
            <template v-for="c in comprobantesTramitador" :key="c.id">
              <div class="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 min-w-0">
                <button
                  type="button"
                  class="flex items-center gap-2 min-w-0 flex-1 text-left"
                  @click="openEditTramitador(c)"
                >
                  <img
                    v-if="c.url && isImageUrl(c.url)"
                    :src="c.url"
                    alt="Preview"
                    class="w-12 h-12 object-cover rounded flex-shrink-0"
                  />
                  <div v-else class="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <UIcon name="i-heroicons-document" class="w-6 h-6 text-primary-500" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-xs text-gray-500">Monto: {{ formatCurrency(parseFloat(comprobantesEditsTramitador[c.id]?.monto ?? c.monto ?? '0') || 0, 'PEN') }}</p>
                    <p class="text-xs text-gray-500">Banco: {{ comprobantesEditsTramitador[c.id]?.banco ?? c.banco ?? '-' }}</p>
                    <p class="text-xs text-gray-500">Fecha: {{ formatDateTimeToDmy(comprobantesEditsTramitador[c.id]?.fecha_cierre ?? c.fecha_cierre ?? '') || '-' }}</p>
                  </div>
                </button>
                <UButton
                  v-if="isAdministracion"
                  icon="i-heroicons-trash"
                  color="error"
                  variant="ghost"
                  size="xs"
                  title="Eliminar comprobante"
                  @click.stop="confirmarEliminarComprobanteTramitador(c.id)"
                />
              </div>
            </template>
            <!-- Pendientes tramitador: varios con preview -->
            <template v-for="(pend, idx) in pendingPagoTramitador" :key="'tram-' + idx">
              <div class="flex items-center gap-2 p-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50/50 dark:bg-gray-800 min-w-0">
                <img
                  v-if="isImageFile(pend.voucher)"
                  :src="getTramitadorPreviewUrl(idx)"
                  alt="Vista previa"
                  class="w-12 h-12 object-cover rounded flex-shrink-0"
                />
                <div v-else class="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <UIcon name="i-heroicons-document" class="w-6 h-6 text-gray-500" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-xs text-gray-500">Monto: {{ formatCurrency(parseFloat(pend.monto || '0') || 0, 'PEN') }}</p>
                  <p class="text-xs text-gray-500">Banco: {{ pend.banco || '-' }}</p>
                  <p class="text-xs text-gray-500">Fecha: {{ formatDateTimeToDmy(pend.fecha_cierre) || '-' }}</p>
                  <p class="text-xs text-amber-600 dark:text-amber-400">Pendiente de guardar</p>
                </div>
                <UButton
                  v-if="isAdministracion"
                  icon="i-heroicons-x-mark"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  title="Quitar"
                  @click.stop="quitarPendienteTramitador(idx)"
                />
              </div>
            </template>
            <button
              type="button"
              class="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 flex items-center justify-center flex-shrink-0 transition-colors"
              @click="openModalTramitador"
              title="Subir comprobante"
            >
              <UIcon name="i-heroicons-plus" class="w-7 h-7 text-gray-400" />
            </button>
          </div>
        </div>
        <div class="mt-4">
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
            :class="totalPagadoTramitador >= Number(tramite?.tramitador || 0) ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'"
          >
            <UIcon :name="totalPagadoTramitador >= Number(tramite?.tramitador || 0) ? 'i-heroicons-check-circle' : 'i-heroicons-clock'" class="w-4 h-4" />
            {{ totalPagadoTramitador >= Number(tramite?.tramitador || 0) ? 'Pagado' : 'Pendiente' }}
          </span>
        </div>
      </div>
    </section>

    <ModalPreview
      :is-open="!!previewFile"
      :file="previewFile"
      @close="previewFile = null"
    />

    <!-- Modal subir/editar comprobante: subida (monto, banco, fecha, voucher) o edición (solo monto, banco, fecha). -->
    <CreatePagoModal
      v-if="showComprobanteModal"
      :cliente-nombre="tramite?.cliente?.nombre ?? 'Permiso'"
      currency="PEN"
      :titulo-comprobante="comprobanteModalTitulo"
      :solo-comprobante="false"
      :edit-comprobante="comprobanteEditRef?.comprobante ?? undefined"
      @save="onComprobanteModalSave"
      @close="comprobanteEditRef = null; showComprobanteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTramitesAduana } from '~/composables/basedatos/useTramitesAduana'
import { useTramiteDocumentos } from '~/composables/basedatos/useTramiteDocumentos'
import { useUserRole } from '~/composables/auth/useUserRole'
import { useModal } from '~/composables/commons/useModal'
import { ROLES } from '~/constants/roles'
import { formatCurrency, formatDateTimeToDmy } from '~/utils/formatters'
import ModalPreview from '~/components/commons/ModalPreview.vue'
import CreatePagoModal from '~/components/commons/CreatePagoModal.vue'
import FileUploader from '~/components/commons/FileUploader.vue'
import type { TramiteAduana, TramiteAduanaTipoPermisoItem, PagoConDatos, TramiteDocumento } from '~/types/basedatos/tramiteAduana'
import type { FileItem } from '~/types/commons/file'
import { TramiteAduanaDocumentoService } from '~/services/basedatos/tramiteAduanaDocumentoService'

definePageMeta({ layout: 'default' })

const route = useRoute()
const idTramite = Number(route.params.id)
const { hasRole } = useUserRole()
const isAdministracion = computed(() => hasRole(ROLES.ADMINISTRACION))

const { getTramiteById } = useTramitesAduana()
const {
  loadDocumentos,
  pagosConDatos,
  tiposPermisoSections,
  seguimientoCompartido,
  comprobantesDerechoPorTipo,
  comprobantesTramitador,
  loading,
} = useTramiteDocumentos()
const { showSuccess, showError, showConfirmation } = useModal()

const tramite = ref<TramiteAduana | null>(null)
/** Estado de verificación por cada pago de servicio (índice = idx en pagosConDatos). Por defecto PENDIENTE. */
const estadosServicio = ref<string[]>([])
const previewFile = ref<FileItem | null>(null)
const saving = ref(false)

/** Modal subir/editar comprobante: visible, contexto y opcional comprobante a editar. */
const showComprobanteModal = ref(false)
/** 'tramitador' | id_tipo_permiso (number) cuando es derecho por tipo */
const comprobanteModalContext = ref<'tramitador' | number>('tramitador')
/** Si no es null, el modal está en modo edición (monto, banco, fecha; sin reemplazar archivo). */
const comprobanteEditRef = ref<{ context: 'tramitador' | number; comprobante: { id: number; monto?: string | null; banco?: string | null; fecha_cierre?: string | null; url?: string; nombre_original?: string } } | null>(null)
const comprobanteModalTitulo = computed(() => {
  if (comprobanteEditRef.value) return 'Editar comprobante'
  if (comprobanteModalContext.value === 'tramitador') return 'Comprobante - Tramitador'
  const tipo = tramite.value?.tipos_permiso?.find(t => t.id === comprobanteModalContext.value)
  return tipo ? `Comprobante - ${tipo.nombre_permiso}` : 'Subir comprobante'
})
/** Pagos pendientes por tipo (varios por documento) y tramitador (varios). Se envían al hacer Guardar. */
type PagoPendiente = { monto: string; banco: string; fecha_cierre: string; voucher: File }
const pendingPagosDerecho = ref<Record<number, PagoPendiente[]>>({})
const pendingPagoTramitador = ref<PagoPendiente[]>([])

/** Ediciones de comprobantes ya guardados (se envían en el mismo guardar-verificacion, sin otros endpoints). */
const comprobantesEditsDerecho = ref<Record<number, { monto?: string; banco?: string; fecha_cierre?: string }>>({})
const comprobantesEditsTramitador = ref<Record<number, { monto?: string; banco?: string; fecha_cierre?: string }>>({})
/** Archivos nuevos para reemplazar comprobantes existentes (id -> File), se envían al guardar. */
const comprobantesReemplazoDerecho = ref<Record<number, File>>({})
const comprobantesReemplazoTramitador = ref<Record<number, File>>({})

const hasPendientes = computed(() =>
  Object.values(pendingPagosDerecho.value).some(arr => arr.length > 0) ||
  pendingPagoTramitador.value.length > 0 ||
  Object.keys(comprobantesEditsDerecho.value).length > 0 ||
  Object.keys(comprobantesEditsTramitador.value).length > 0 ||
  Object.keys(comprobantesReemplazoDerecho.value).length > 0 ||
  Object.keys(comprobantesReemplazoTramitador.value).length > 0
)

/** Object URLs para vista previa por ítem pendiente: key = "derecho-{tipoId}-{idx}" o "tramitador-{idx}". */
const pendingPreviewUrls = ref<Record<string, string>>({})
function updatePendingPreviewUrls() {
  const next: Record<string, string> = {}
  for (const [idStr, arr] of Object.entries(pendingPagosDerecho.value)) {
    const tipoId = Number(idStr)
    ;(arr ?? []).forEach((p, idx) => {
      if (p?.voucher && isImageFile(p.voucher)) {
        next[`derecho-${tipoId}-${idx}`] = URL.createObjectURL(p.voucher)
      }
    })
  }
  pendingPagoTramitador.value.forEach((p, idx) => {
    if (p?.voucher && isImageFile(p.voucher)) {
      next[`tramitador-${idx}`] = URL.createObjectURL(p.voucher)
    }
  })
  Object.values(pendingPreviewUrls.value).forEach(url => URL.revokeObjectURL(url))
  pendingPreviewUrls.value = next
}
watch([pendingPagosDerecho, pendingPagoTramitador], updatePendingPreviewUrls, { deep: true })
onUnmounted(() => {
  Object.values(pendingPreviewUrls.value).forEach(url => URL.revokeObjectURL(url))
})

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}
/** Para mostrar preview de comprobante ya guardado (url del API). */
function isImageUrl(url: string): boolean {
  if (!url) return false
  const u = url.toLowerCase()
  return u.includes('.jpg') || u.includes('.jpeg') || u.includes('.png') || u.includes('.gif') || u.includes('.webp')
}

function getPendingFilePreviewUrl(tipoId: number, index: number): string {
  return pendingPreviewUrls.value[`derecho-${tipoId}-${index}`] ?? ''
}
function getTramitadorPreviewUrl(index: number): string {
  return pendingPreviewUrls.value[`tramitador-${index}`] ?? ''
}

/** Convierte documentos del API a FileItem para FileUploader (Expediente/CPB y RH). */
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
function docToFileItems(docs: TramiteDocumento[]): FileItem[] {
  return (docs ?? []).map(docToFileItem)
}

const estadosOptions = [
  { label: 'Pendiente', value: 'PENDIENTE' },
  { label: 'Conforme', value: 'CONFIRMADO' },
  { label: 'Observado', value: 'OBSERVADO' },
]

function estadoServicioLabel(value: string) {
  const o = estadosOptions.find(e => e.value === value)
  return o?.label ?? value
}

function estadoServicioBadgeClass(value: string) {
  switch (value) {
    case 'CONFIRMADO': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
    case 'OBSERVADO': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
}

/** Clases de la card del pago (mismo estilo que verificacion/curso/[id]). */
function cardClassByEstado(estado: string): string {
  switch (estado) {
    case 'CONFIRMADO':
      return 'bg-green-50 border-green-200 dark:bg-green-800 dark:border-green-700'
    case 'PENDIENTE':
      return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
    case 'OBSERVADO':
      return 'bg-red-50 border-red-200 dark:bg-red-800 dark:border-red-700'
    default:
      return 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
  }
}

function onEstadoServicioChange(_idx: number, _val: string) {
  // Estado ya actualizado en estadosServicio[idx]; al guardar se persiste
}

/** Header: Importe = total de los montos de pago_servicio (pagosConDatos). */
const totalImporte = computed(() => {
  return pagosConDatos.value.reduce((sum, p) => sum + parseFloat(p.monto || '0') || 0, 0)
})

/** Header: Pagado = suma de los montos de pago_servicio que estén Conforme (CONFIRMADO). */
const totalPagado = computed(() => {
  return pagosConDatos.value.reduce((sum, p, idx) => {
    if (estadosServicio.value[idx] === 'CONFIRMADO') {
      return sum + (parseFloat(p.monto || '0') || 0)
    }
    return sum
  }, 0)
})

/** Total pagado por tipo (derecho trámite): suma de montos de comprobantes + pendientes + ediciones. */
const totalPagadoDerechoByTipo = computed(() => {
  const out: Record<number, number> = {}
  const tipos = tramite.value?.tipos_permiso ?? []
  for (const tipo of tipos) {
    const comprobantes = comprobantesDerechoPorTipo.value[tipo.id] ?? []
    let sum = comprobantes.reduce((s, c) => {
      const edit = comprobantesEditsDerecho.value[c.id]
      const m = edit?.monto != null ? parseFloat(edit.monto) : parseFloat(c.monto || '0')
      return s + (Number.isNaN(m) ? 0 : m)
    }, 0)
    const pendientes = pendingPagosDerecho.value[tipo.id] ?? []
    pendientes.forEach(p => {
      if (p?.monto) {
        const m = parseFloat(p.monto)
        if (!Number.isNaN(m)) sum += m
      }
    })
    out[tipo.id] = sum
  }
  return out
})

/** Total pagado tramitador: suma de comprobantes + pendientes + ediciones. */
const totalPagadoTramitador = computed(() => {
  const comprobantes = comprobantesTramitador.value
  let sum = comprobantes.reduce((s, c) => {
    const edit = comprobantesEditsTramitador.value[c.id]
    const m = edit?.monto != null ? parseFloat(edit.monto) : parseFloat(c.monto || '0')
    return s + (Number.isNaN(m) ? 0 : m)
  }, 0)
  pendingPagoTramitador.value.forEach(p => {
    if (p?.monto) {
      const m = parseFloat(p.monto)
      if (!Number.isNaN(m)) sum += m
    }
  })
  return sum
})

function getDocumentosTipo(idTipoPermiso: number) {
  const sec = tiposPermisoSections.value.find(s => s.id_tipo_permiso === idTipoPermiso)
  if (!sec) return []
  const docs = [...(sec.documentos_tramite || []), ...(sec.seguimiento || [])]
  return docs
}

function openPreview(url: string, fileName: string) {
  previewFile.value = {
    id: 0,
    file_name: fileName || 'Comprobante',
    file_url: url,
    type: '',
    size: 0,
    lastModified: 0,
    file_ext: (fileName || '').split('.').pop() || '',
  }
}

function openModalDerechoTramite(tipo: TramiteAduanaTipoPermisoItem) {
  comprobanteEditRef.value = null
  comprobanteModalContext.value = tipo.id
  showComprobanteModal.value = true
}

function openModalTramitador() {
  comprobanteEditRef.value = null
  comprobanteModalContext.value = 'tramitador'
  showComprobanteModal.value = true
}

function openEditDerecho(tipo: TramiteAduanaTipoPermisoItem, c: { id: number; monto?: string | null; banco?: string | null; fecha_cierre?: string | null; url?: string; nombre_original?: string }) {
  comprobanteEditRef.value = { context: tipo.id, comprobante: { id: c.id, monto: c.monto ?? undefined, banco: c.banco ?? undefined, fecha_cierre: c.fecha_cierre ?? undefined, url: c.url, nombre_original: c.nombre_original } }
  comprobanteModalContext.value = tipo.id
  showComprobanteModal.value = true
}

function openEditTramitador(c: { id: number; monto?: string | null; banco?: string | null; fecha_cierre?: string | null; url?: string; nombre_original?: string }) {
  comprobanteEditRef.value = { context: 'tramitador', comprobante: { id: c.id, monto: c.monto ?? undefined, banco: c.banco ?? undefined, fecha_cierre: c.fecha_cierre ?? undefined, url: c.url, nombre_original: c.nombre_original } }
  comprobanteModalContext.value = 'tramitador'
  showComprobanteModal.value = true
}

function quitarPendienteDerecho(tipoId: number, index: number) {
  const arr = pendingPagosDerecho.value[tipoId] ?? []
  pendingPagosDerecho.value = { ...pendingPagosDerecho.value, [tipoId]: arr.filter((_, i) => i !== index) }
}

function quitarPendienteTramitador(index: number) {
  pendingPagoTramitador.value = pendingPagoTramitador.value.filter((_, i) => i !== index)
}

/** Convierte fecha del modal (CalendarDate o string) a YYYY-MM-DD. */
function toFechaCierre(value: unknown): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const d = value as { year?: number; month?: number; day?: number }
  if (d?.year != null && d?.month != null && d?.day != null) {
    return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
  }
  return new Date().toISOString().slice(0, 10)
}

function onComprobanteModalSave(data: { monto?: string; banco?: string | string[]; fecha?: unknown; voucher?: File | null }) {
  const banco = Array.isArray(data.banco) ? data.banco[0] : data.banco
  const montoStr = data.monto != null ? String(data.monto).trim() : ''
  const bancoStr = banco != null ? String(banco).trim() : ''
  const fechaCierre = data.fecha != null ? toFechaCierre(data.fecha) : ''

  if (comprobanteEditRef.value) {
    const { context, comprobante } = comprobanteEditRef.value
    if (!montoStr || !bancoStr || !fechaCierre) {
      showError('Datos incompletos', 'Complete monto, banco y fecha de cierre.')
      return
    }
    if (context === 'tramitador') {
      comprobantesEditsTramitador.value = { ...comprobantesEditsTramitador.value, [comprobante.id]: { monto: montoStr, banco: bancoStr, fecha_cierre: fechaCierre } }
      if (data.voucher) {
        comprobantesReemplazoTramitador.value = { ...comprobantesReemplazoTramitador.value, [comprobante.id]: data.voucher }
      }
    } else {
      comprobantesEditsDerecho.value = { ...comprobantesEditsDerecho.value, [comprobante.id]: { monto: montoStr, banco: bancoStr, fecha_cierre: fechaCierre } }
      if (data.voucher) {
        comprobantesReemplazoDerecho.value = { ...comprobantesReemplazoDerecho.value, [comprobante.id]: data.voucher }
      }
    }
    comprobanteEditRef.value = null
    showComprobanteModal.value = false
    return
  }

  const file = data?.voucher
  if (!file) {
    showError('Falta comprobante', 'Debe adjuntar el voucher o comprobante de pago.')
    return
  }
  if (!montoStr || !bancoStr || !fechaCierre) {
    showError('Datos incompletos', 'Complete monto, banco y fecha de cierre.')
    return
  }
  const pago: PagoPendiente = {
    monto: montoStr,
    banco: bancoStr,
    fecha_cierre: fechaCierre,
    voucher: file,
  }
  if (comprobanteModalContext.value === 'tramitador') {
    pendingPagoTramitador.value = [...pendingPagoTramitador.value, pago]
  } else {
    const tipoId = comprobanteModalContext.value
    const arr = pendingPagosDerecho.value[tipoId] ?? []
    pendingPagosDerecho.value = { ...pendingPagosDerecho.value, [tipoId]: [...arr, pago] }
  }
  showComprobanteModal.value = false
}

function confirmarEliminarComprobanteDerecho(idTipoPermiso: number, idComprobante: number) {
  showConfirmation(
    'Eliminar comprobante',
    '¿Eliminar este comprobante de pago (derecho de trámite)? Esta acción no se puede deshacer.',
    async () => {
      const res = await TramiteAduanaDocumentoService.eliminarComprobanteDerecho(idTramite, idComprobante)
      if (res.success) {
        showSuccess('Eliminado', 'Comprobante eliminado.')
        await loadDocumentos(idTramite)
      } else {
        showError('Error', res.error ?? 'No se pudo eliminar.')
      }
    }
  )
}

function confirmarEliminarComprobanteTramitador(idComprobante: number) {
  showConfirmation(
    'Eliminar comprobante',
    '¿Eliminar este comprobante del tramitador? Esta acción no se puede deshacer.',
    async () => {
      const res = await TramiteAduanaDocumentoService.eliminarComprobanteTramitador(idTramite, idComprobante)
      if (res.success) {
        showSuccess('Eliminado', 'Comprobante eliminado.')
        await loadDocumentos(idTramite)
      } else {
        showError('Error', res.error ?? 'No se pudo eliminar.')
      }
    }
  )
}

async function handleSave() {
  if (!isAdministracion.value) return
  saving.value = true
  try {
    const estadosPagoServicio = pagosConDatos.value
      .map((pago, idx) => ({ id_documento: pago.document?.id, estado: estadosServicio.value[idx] }))
      .filter((e): e is { id_documento: number; estado: string } => !!e.id_documento && !!e.estado)

    const comprobantesDerecho = Object.entries(pendingPagosDerecho.value).flatMap(([idTipoPermiso, arr]) =>
      (arr ?? []).filter(p => !!p?.voucher).map(p => ({
        idTipoPermiso: Number(idTipoPermiso),
        file: p!.voucher,
        monto: p!.monto || undefined,
        banco: p!.banco || undefined,
        fecha_cierre: p!.fecha_cierre || undefined,
      }))
    )
    const pagoTramitador = (pendingPagoTramitador.value ?? []).filter(p => !!p?.voucher).map(p => ({
      file: p.voucher,
      monto: p.monto || undefined,
      banco: p.banco || undefined,
      fecha_cierre: p.fecha_cierre || undefined,
    }))

    const comprobantesDerechoActualizar = Object.entries(comprobantesEditsDerecho.value).map(([id, d]) => ({
      id: Number(id),
      ...d,
    }))
    const comprobantesTramitadorActualizar = Object.entries(comprobantesEditsTramitador.value).map(([id, d]) => ({
      id: Number(id),
      ...d,
    }))
    const comprobantesDerechoReemplazar = Object.entries(comprobantesReemplazoDerecho.value).map(([id, file]) => ({ id: Number(id), file }))
    const comprobantesTramitadorReemplazar = Object.entries(comprobantesReemplazoTramitador.value).map(([id, file]) => ({ id: Number(id), file }))
    const tienePagos = comprobantesDerecho.length > 0 || pagoTramitador.length > 0 || comprobantesDerechoActualizar.length > 0 || comprobantesTramitadorActualizar.length > 0 || comprobantesDerechoReemplazar.length > 0 || comprobantesTramitadorReemplazar.length > 0

    const res = await TramiteAduanaDocumentoService.guardarVerificacion(idTramite, {
      estadosPagoServicio,
      comprobantesDerecho: comprobantesDerecho.length ? comprobantesDerecho : undefined,
      pagoTramitador: pagoTramitador.length ? pagoTramitador : undefined,
      comprobantesDerechoActualizar: comprobantesDerechoActualizar.length ? comprobantesDerechoActualizar : undefined,
      comprobantesTramitadorActualizar: comprobantesTramitadorActualizar.length ? comprobantesTramitadorActualizar : undefined,
      comprobantesDerechoReemplazar: comprobantesDerechoReemplazar.length ? comprobantesDerechoReemplazar : undefined,
      comprobantesTramitadorReemplazar: comprobantesTramitadorReemplazar.length ? comprobantesTramitadorReemplazar : undefined,
    })

    if (res.success) {
      pendingPagosDerecho.value = {}
      pendingPagoTramitador.value = []
      comprobantesEditsDerecho.value = {}
      comprobantesEditsTramitador.value = {}
      comprobantesReemplazoDerecho.value = {}
      comprobantesReemplazoTramitador.value = {}
      await loadDocumentos(idTramite)
      estadosServicio.value = pagosConDatos.value.map((p) => estadoFromApi(p))
      const mensaje = [estadosPagoServicio.length && 'estados', tienePagos && 'pagos/comprobantes'].filter(Boolean).join(' y ')
      showSuccess('Guardado', mensaje ? `Se guardó ${mensaje}.` : 'Cambios guardados.', { duration: 3000 })
    } else {
      showError('No se pudo guardar', res.error ?? 'Error al guardar la verificación.', { persistent: true })
    }
  } catch (e) {
    showError(
      'Error al guardar',
      'No se pudo guardar. Compruebe que el backend expone POST .../guardar-verificacion (ver docs/API_VERIFICACION_PERMISOS.md).',
      { persistent: true }
    )
  } finally {
    saving.value = false
  }
}

/** Lee el estado de verificación del pago desde la BD (respuesta del API). Prioridad: estado_verificacion, estado, status. */
function estadoFromApi(pago: PagoConDatos): string {
  const raw = pago.estado_verificacion ?? pago.estado ?? pago.status
  if (raw && ['PENDIENTE', 'CONFIRMADO', 'OBSERVADO'].includes(String(raw).toUpperCase())) {
    return String(raw).toUpperCase()
  }
  return 'PENDIENTE'
}

async function load() {
  try {
    tramite.value = await getTramiteById(idTramite)
    await loadDocumentos(idTramite)
    // El estado de cada pago viene de la BD (respuesta del API); si no viene, se usa PENDIENTE
    estadosServicio.value = pagosConDatos.value.map((p) => estadoFromApi(p))
  } catch (e) {
    showError('Error', 'No se pudo cargar el permiso.', { persistent: true })
  }
}

onMounted(() => load())
</script>
