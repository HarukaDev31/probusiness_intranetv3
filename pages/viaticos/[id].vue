<template>
  <div class="md:p-6">
    <!-- Skeleton Loading -->
    <div v-if="loading" class="max-w-6xl mx-auto space-y-6">
      <!-- Header skeleton -->
      <div class="mb-6 flex items-center justify-between">
        <USkeleton class="h-10 w-24 rounded" />
        <USkeleton class="h-8 w-32 rounded-full" />
      </div>

      <!-- Grid skeleton -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Columna izquierda skeleton -->
        <div class="lg:col-span-2 space-y-6">
          <UCard>
            <template #header>
              <USkeleton class="h-6 w-48 rounded" />
            </template>
            <div class="space-y-4">
              <USkeleton class="h-4 w-32 rounded" />
              <USkeleton class="h-6 w-full rounded" />
              <div class="grid grid-cols-2 gap-4">
                <div v-for="i in 4" :key="i" class="space-y-2">
                  <USkeleton class="h-3 w-24 rounded" />
                  <USkeleton class="h-5 w-full rounded" />
                </div>
              </div>
            </div>
          </UCard>
          <UCard>
            <template #header>
              <USkeleton class="h-6 w-40 rounded" />
            </template>
            <USkeleton class="h-24 w-full rounded" />
          </UCard>
        </div>
        
        <!-- Columna derecha skeleton -->
        <div class="space-y-6">
          <UCard>
            <template #header>
              <USkeleton class="h-6 w-36 rounded" />
            </template>
            <USkeleton class="h-64 w-full rounded-lg" />
          </UCard>
          <UCard>
            <template #header>
              <USkeleton class="h-6 w-40 rounded" />
            </template>
            <USkeleton class="h-64 w-full rounded-lg" />
          </UCard>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-600 mb-4">{{ error }}</p>
      <UButton @click="goBack" color="neutral" variant="soft">Volver</UButton>
    </div>

    <div v-else-if="viatico" class="max-w-6xl mx-auto space-y-6">
      <!-- Header con botón de volver y estado -->
      <div class="flex items-center justify-between">
        <UButton 
          icon="i-heroicons-arrow-left" 
          color="neutral" 
          variant="ghost" 
          @click="goBack"
        >
          Volver
        </UButton>
        <USelect
          v-if="isAdmin"
          v-model="selectedStatus"
          :items="[
            { label: 'Pendiente', value: 'PENDING', disabled: true },
            { label: 'Rechazado', value: 'REJECTED', disabled: false },
            { label: 'Confirmado', value: 'CONFIRMED', disabled: true }
          ]"
          size="lg"
          class="text-sm font-semibold px-2 py-1 w-48"
          @update:modelValue="handleStatusChange"
        />
      </div>

      <!-- Grid principal: Información y Comprobantes -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Columna izquierda: Información básica -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Información General -->
          <UCard class="bg-white dark:bg-gray-800">
            <template #header>
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-primary-500" />
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Información General</h2>
                </div>
                <UBadge v-if="isAdmin && viatico.codigo_confirmado" color="primary" variant="solid" size="md">
                  {{ viatico.codigo_confirmado }}
                </UBadge>
              </div>
            </template>
            
            <div class="space-y-6">
              <!-- Asunto -->
              <div class="border-b border-gray-200 dark:border-gray-700 pb-4">
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Asunto</label>
                <p class="text-base text-gray-900 dark:text-white font-medium">{{ viatico.subject }}</p>
              </div>

              <!-- Grid de información -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">   
                <!-- Fecha de Creación -->
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Fecha de Reintegro</label>
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-calendar" class="w-4 h-4 text-gray-400" />
                    <p class="text-sm text-gray-900 dark:text-white">{{ formatDateTimeToDmy(viatico.reimbursement_date) }}</p>
                  </div>
                </div>
                <!-- Fecha de Reintegro -->
                <div v-if="viatico.return_date">
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Fecha de devolución</label>
                  <div class="flex items-center gap-2" >
                    <UIcon name="i-heroicons-calendar" class="w-4 h-4 text-gray-400" />
                    <p class="text-sm text-gray-900 dark:text-white">{{ formatDateTimeToDmy(viatico.return_date) }}</p>
                  </div>
                </div>
                <!-- Área Solicitante -->
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Área Solicitante</label>
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-building-office" class="w-4 h-4 text-gray-400" />
                    <p class="text-sm text-gray-900 dark:text-white">{{ viatico.requesting_area }}</p>
                  </div>
                </div>

                <!-- Monto Total -->
                <div class="md:col-span-2">
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Monto Total</label>
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-banknotes" class="w-5 h-5 text-primary-500" />
                    <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {{ formatCurrency(Number(viatico.total_amount), 'PEN') }}
                    </p>
                  </div>
                </div>

                <!-- Solicitante (solo para admin) -->
                <div v-if="isAdmin" class="md:col-span-2">
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Solicitante</label>
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-user" class="w-4 h-4 text-gray-400" />
                    <p class="text-sm text-gray-900 dark:text-white font-medium">{{ viatico.nombre_usuario || 'N/A' }}</p>
                  </div>
                </div>

                <!-- Código de confirmación (solo para administración) -->
                <div v-if="isAdmin" class="md:col-span-2">
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Código de confirmación</label>
                  <div class="flex items-center gap-2">
                    <UBadge v-if="viatico.codigo_confirmado" color="primary" variant="solid" size="md">
                      {{ viatico.codigo_confirmado }}
                    </UBadge>
                    <span v-else class="text-sm text-gray-500 dark:text-gray-400">—</span>
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Descripción del Gasto -->
          <UCard class="bg-white dark:bg-gray-800">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-primary-500" />
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Descripción del Gasto</h2>
              </div>
            </template>
            
            <div class="prose prose-sm max-w-none">
              <p class="text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">{{ viatico.expense_description }}</p>
            </div>
          </UCard>
        </div>

        <!-- Columna derecha: Comprobantes -->
        <div class="space-y-6">
          <!-- Evidencias (múltiples pagos o comprobante único legacy) -->
          <UCard class="bg-white dark:bg-gray-800">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-document-duplicate" class="w-5 h-5 text-primary-500" />
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Evidencia</h2>
                  <UBadge v-if="hasPagos" color="primary" variant="soft" size="sm">{{ viatico.pagos!.length }} {{ viatico.pagos!.length === 1 ? 'comprobante' : 'comprobantes' }}</UBadge>
                </div>
              </div>
            </template>

            <!-- Múltiples evidencias (pagos) -->
            <div v-if="hasPagos" class="space-y-4">
              <div
                v-for="(pago, index) in viatico.pagos"
                :key="pago.id"
                class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/50"
              >
                <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center gap-2">
                  <span class="flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-sm font-semibold">{{ index + 1 }}</span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ pago.concepto }}</span>
                  <span class="ml-auto text-sm font-semibold text-primary-600 dark:text-primary-400">{{ formatCurrency(Number(pago.monto), 'PEN') }}</span>
                </div>
                <div class="p-4">
                  
                  <div v-if="pagoUrl(pago)" class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                    <div v-if="isPagoImage(pago)" class="bg-gray-100 dark:bg-gray-700 flex justify-center">
                      <img
                        :src="pagoUrl(pago)!"
                        :alt="pago.file_original_name || pago.concepto"
                        class="max-h-64 w-full object-contain cursor-pointer hover:opacity-90 transition"
                        @click="openPagoFile(pago)"
                      />
                    </div>
                    <div v-else-if="isPagoPdf(pago)" class="min-h-[200px]">
                      <iframe :src="pagoUrl(pago)!" class="w-full h-[280px] rounded-lg border-0" frameborder="0" title="Comprobante" />
                      <UButton size="xs" color="primary" variant="soft" class="mt-2" @click="openPagoFile(pago)">Abrir en nueva pestaña</UButton>
                    </div>
                    <div v-else class="p-4 flex items-center justify-between gap-2">
                      <UIcon name="i-heroicons-document" class="w-10 h-10 text-gray-400 shrink-0" />
                      <span class="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">{{ pago.file_original_name || 'Comprobante' }}</span>
                      <UButton size="xs" color="primary" variant="soft" @click="openPagoFile(pago)">Ver</UButton>
                    </div>
                  </div>
                  <div v-else class="p-4 flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <UIcon name="i-heroicons-document-minus" class="w-8 h-8" />
                    <span class="text-sm">{{ pago.file_original_name || 'Sin archivo' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Un solo comprobante (legacy) -->
            <div v-else-if="viatico.url_comprobante" class="space-y-3">
              <div class="relative group">
                <div v-if="isImageFile(viatico.url_comprobante)">
                  <img
                    :src="viatico.url_comprobante"
                    alt="Comprobante"
                    class="w-full h-auto rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:border-primary-400 transition-all duration-200 shadow-sm"
                    @click="() => openComprobanteModal(viatico?.url_comprobante, viatico?.url_comprobante)"
                  />
                </div>
                <div v-else-if="isPdfFile(viatico.url_comprobante)">
                  <iframe :src="viatico.url_comprobante" class="w-full h-auto min-h-[280px] rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm" frameborder="0" />
                </div>
                <div v-else class="flex items-center gap-2 p-4 border rounded-lg">
                  <UIcon name="i-heroicons-document" class="w-5 h-5 text-primary-500" />
                  <p class="text-sm text-gray-900 dark:text-white">{{ viatico.url_comprobante }}</p>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8">
              <UIcon name="i-heroicons-document-minus" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p class="text-sm text-gray-500 dark:text-gray-400 italic">Sin evidencias</p>
            </div>
          </UCard>

          <!-- Comprobantes de Retribución (múltiples, solo para admin) -->
          <UCard v-if="isAdmin" class="bg-white dark:bg-gray-800">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Comprobantes de Retribución</h2>
                <UBadge v-if="retribucionesList.length" color="primary" variant="soft" size="sm">{{ retribucionesList.length }} {{ retribucionesList.length === 1 ? 'comprobante' : 'comprobantes' }}</UBadge>
              </div>
            </template>
            
            <div v-if="retribucionesList.length" class="space-y-4">
              <div
                v-for="(item, index) in retribucionesList"
                :key="item.id"
                class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/50"
              >
                <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between gap-2 flex-wrap">
                  <span class="flex items-center gap-2 flex-1 min-w-0">
                    <span class="flex items-center justify-center w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 text-sm font-semibold flex-shrink-0">{{ index + 1 }}</span>
                    <div class="min-w-0">
                      <span class="font-medium text-gray-900 dark:text-white block truncate">{{ item.file_original_name || `Comprobante ${index + 1}` }}</span>
                      <span v-if="item.banco || item.monto != null" class="text-xs text-gray-500 dark:text-gray-400">
                        {{ item.banco }}{{ item.banco && (item.monto != null) ? ' — ' : '' }}{{ item.monto != null ? formatCurrency(Number(item.monto), 'PEN') : '' }}
                      </span>
                    </div>
                  </span>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    
                    <UButton
                      v-if="isAdmin"
                      icon="i-heroicons-trash"
                      color="error"
                      variant="soft"
                      size="xs"
                      :loading="deletingRetribucionId === item.id"
                      @click="handleDeleteRetribucion(item.id)"
                    >
                      Eliminar
                    </UButton>
                  </div>
                </div>
                <div class="p-4">
                  <div v-if="retribucionUrl(item)" class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                    <div v-if="isRetribucionImage(item)" class="bg-gray-100 dark:bg-gray-700 flex justify-center cursor-pointer" @click="openRetribucionModal(item)">
                      <img :src="retribucionUrl(item)!" alt="Comprobante" class="max-h-48 w-auto object-contain" />
                    </div>
                    <div v-else class="p-4 flex items-center justify-between bg-gray-100 dark:bg-gray-700">
                      <span class="text-sm text-gray-700 dark:text-gray-300">{{ item.file_original_name || 'Documento' }}</span>
                      <UButton size="xs" variant="soft" @click="openRetribucionModal(item)">Ver</UButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <UIcon name="i-heroicons-document-minus" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p class="text-sm text-gray-500 dark:text-gray-400 italic">Sin comprobantes de retribución</p>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Acciones de Administración: Agregar retribuciones y Guardar todo -->
      <UCard v-if="isAdmin && viatico.status !== 'CONFIRMED'" class="bg-white dark:bg-gray-800">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5 text-primary-500" />
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Subir Comprobantes de Retribución</h2>
          </div>
        </template>
        
        <div class="space-y-6">
          <div class="flex items-center justify-between gap-4 flex-wrap">
            <UButton
              icon="i-heroicons-plus-circle"
              color="primary"
              @click="openAgregarRetribucion"
            >
              Agregar pago
            </UButton>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Total a pagar: <span class="font-semibold">{{ formatCurrency(Number(viatico.total_amount), 'PEN') }}</span>
              <span v-if="pendingRetribuciones.length" class="ml-2">
                — Suma: <span class="font-semibold" :class="sumaPending === totalAPagar ? 'text-green-600' : 'text-amber-600'">{{ formatCurrency(sumaPending, 'PEN') }}</span>
              </span>
            </p>
          </div>

          <!-- Lista de retribuciones pendientes (vista previa) -->
          <div v-if="pendingRetribuciones.length" class="space-y-3">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Comprobantes a guardar (vista previa)</p>
            <div
              v-for="(item, index) in pendingRetribuciones"
              :key="item.id"
              class="flex items-center gap-4 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
            >
              <span class="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-sm font-semibold">{{ index + 1 }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ item.voucher.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.banco }} — {{ formatCurrency(item.monto, 'PEN') }}</p>
              </div>
              <div v-if="isPendingFileImage(item.voucher)" class="w-12 h-12 rounded border border-gray-200 dark:border-gray-600 overflow-hidden flex-shrink-0">
                <img :src="pendingPreviewUrl(item)" alt="" class="w-full h-full object-cover" />
              </div>
              <div v-else class="w-12 h-12 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                <UIcon name="i-heroicons-document" class="w-6 h-6 text-gray-500" />
              </div>
              <UButton icon="i-heroicons-trash" color="error" variant="ghost" size="xs" @click="removePendingRetribucion(item.id)" />
            </div>
            <UButton
              class="w-full"
              icon="i-heroicons-check"
              color="primary"
              :disabled="!canGuardarTodo"
              :loading="uploadingFile"
              @click="handleGuardarTodo"
            >
              Guardar
            </UButton>
            <p v-if="pendingRetribuciones.length && !sumaCoincideConTotal" class="text-xs text-amber-600 dark:text-amber-400">
              Las retribuciones se guardarán pero el viático permanecerá en Pendiente hasta que la suma coincida con el total.
            </p>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useViaticos } from '~/composables/useViaticos'
import { useUserRole } from '~/composables/auth/useUserRole'
import { useModal } from '~/composables/commons/useModal'
import { useSpinner } from '~/composables/commons/useSpinner'
import { formatDateTimeToDmy, formatCurrency } from '~/utils/formatters'
import { ROLES } from '~/constants/roles'
import CreatePagoModal from '~/components/commons/CreatePagoModal.vue'
import { USelect } from '#components'
import ModalPreview from '~/components/commons/ModalPreview.vue'
import type { UpdateViaticoRequest, ViaticoPago, ViaticoRetribucion } from '~/types/viatico'
import type { FileItem } from '~/types/commons/file'

const route = useRoute()
const { currentViatico, loading, error, loadViaticoById, updateViatico } = useViaticos()
const { hasRole, currentId } = useUserRole()
const { showSuccess, showError, showConfirmation } = useModal()
const { withSpinner } = useSpinner()
const overlay = useOverlay()
const modalPreview = overlay.create(ModalPreview)
const createPagoModal = overlay.create(CreatePagoModal)

const viatico = computed(() => currentViatico.value)
const isAdmin = computed(() => hasRole(ROLES.ADMINISTRACION))
const selectedStatus = ref<string>('')
const uploadingFile = ref(false)
const deletingFile = ref(false)
const deletingRetribucionId = ref<number | null>(null)

/** Retribuciones pendientes de guardar (banco, monto, archivo); al dar Guardar todo se suben y se confirma si suma = total */
interface PendingRetribucion {
  id: string
  banco: string
  monto: number
  fecha_cierre?: string
  voucher: File
}
const pendingRetribuciones = ref<PendingRetribucion[]>([])
const totalAPagar = computed(() => Number(viatico.value?.total_amount ?? 0))
const sumaPending = computed(() => pendingRetribuciones.value.reduce((s, p) => s + p.monto, 0))
/** Puede guardar si hay al menos una retribución pendiente (aunque la suma no coincida con el total) */
const canGuardarTodo = computed(() => pendingRetribuciones.value.length > 0)
/** La suma de pendientes coincide con el total a pagar → al guardar se pasará a Confirmado */
const sumaCoincideConTotal = computed(() => Math.abs(sumaPending.value - totalAPagar.value) < 0.02)

const pendingPreviewUrls = ref<Map<string, string>>(new Map())
function pendingPreviewUrl(item: PendingRetribucion): string {
  return pendingPreviewUrls.value.get(item.id) ?? ''
}
function isPendingFileImage(file: File): boolean {
  return file.type.startsWith('image/')
}
function registerPendingPreview(id: string, file: File) {
  if (!file.type.startsWith('image/')) return
  const url = URL.createObjectURL(file)
  pendingPreviewUrls.value.set(id, url)
}
function unregisterPendingPreview(id: string) {
  const url = pendingPreviewUrls.value.get(id)
  if (url) URL.revokeObjectURL(url)
  pendingPreviewUrls.value.delete(id)
}

function formatFechaToYMD(fecha: { year: number; month: number; day: number } | null | undefined): string | undefined {
  if (!fecha || typeof fecha.year !== 'number' || typeof fecha.month !== 'number' || typeof fecha.day !== 'number') return undefined
  const y = fecha.year
  const m = String(fecha.month).padStart(2, '0')
  const d = String(fecha.day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function openAgregarRetribucion() {
  createPagoModal.open({
    clienteNombre: 'Comprobante de retribución',
    currency: 'PEN',
    tituloComprobante: 'Comprobante de retribución',
    onSave: (data: any) => {
      const banco = Array.isArray(data.banco) ? data.banco[0] : data.banco
      const monto = Number(data.monto)
      if (!data.voucher || !banco || Number.isNaN(monto)) return
      const id = crypto.randomUUID()
      const fecha_cierre = formatFechaToYMD(data.fecha)
      const item: PendingRetribucion = { id, banco, monto, fecha_cierre, voucher: data.voucher }
      pendingRetribuciones.value.push(item)
      registerPendingPreview(id, data.voucher)
      createPagoModal.close()
    },
    onClose: () => createPagoModal.close()
  })
}

function removePendingRetribucion(id: string) {
  unregisterPendingPreview(id)
  pendingRetribuciones.value = pendingRetribuciones.value.filter(p => p.id !== id)
}

async function handleGuardarTodo() {
  if (pendingRetribuciones.value.length === 0 || !viatico.value) return
  try {
    uploadingFile.value = true
    await withSpinner(async () => {
      for (const item of pendingRetribuciones.value) {
        await updateViatico(viatico.value!.id, {
          payment_receipt_file: item.voucher,
          payment_receipt_banco: item.banco,
          payment_receipt_monto: item.monto,
          payment_receipt_fecha_cierre: item.fecha_cierre ?? undefined
        })
      }
      pendingRetribuciones.value.forEach(p => unregisterPendingPreview(p.id))
      pendingRetribuciones.value = []
      showSuccess('Retribuciones guardadas', 'Los comprobantes se han guardado. El estado se actualiza en el servidor según el total retribuido.')
      await loadViaticoById(viatico.value!.id)
    })
  } catch (err: any) {
    showError('Error al guardar', err?.message ?? 'Error desconocido')
  } finally {
    uploadingFile.value = false
  }
}

onUnmounted(() => {
  pendingRetribuciones.value.forEach(p => unregisterPendingPreview(p.id))
})

/** Lista a mostrar: retribuciones del backend o un item legacy por url_payment_receipt */
const retribucionesList = computed(() => {
  const r = viatico.value?.retribuciones
  if (r && r.length > 0) return r
  const url = viatico.value?.url_payment_receipt
  if (url) return [{ id: 0, viatico_id: viatico.value!.id, file_path: '', file_url: url, file_original_name: 'Comprobante de retribución' }] as (ViaticoRetribucion & { file_url?: string })[]
  return []
})

function retribucionUrl(item: ViaticoRetribucion & { file_url?: string | null }): string | null {
  return item.file_url ?? (item as any).file_path ?? null
}

function isRetribucionImage(item: ViaticoRetribucion & { file_url?: string | null }): boolean {
  const url = retribucionUrl(item)
  if (!url) return false
  const ext = getFileExtension(url).toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)
}

function openRetribucionModal(item: ViaticoRetribucion & { file_url?: string | null }) {
  const url = retribucionUrl(item)
  if (!url) return
  const fileItem: FileItem = {
    id: item.id,
    file_name: item.file_original_name || 'Comprobante',
    file_url: url,
    type: isRetribucionImage(item) ? 'image' : (getFileExtension(url).toLowerCase() === 'pdf' ? 'pdf' : 'file'),
    size: 0,
    lastModified: 0,
    file_ext: getFileExtension(url)
  }
  modalPreview.open({ file: fileItem, isOpen: true })
}

const statusOptions = [
  { label: 'Pendiente', value: 'PENDING' },
  { label: 'Confirmado', value: 'CONFIRMED' },
  { label: 'Rechazado', value: 'REJECTED' }
]

// Verificar permisos
const canEdit = computed(() => {
  if (!viatico.value) return false
  if (isAdmin.value) return true
  // Usuario solo puede ver sus propios vi?ticos
  return viatico.value.user_id === currentId.value
})

const goBack = () => {
  if (isAdmin.value) {
    if (viatico.value?.status === 'CONFIRMED') {
      navigateTo('/viaticos/completados')
    } else {
      navigateTo('/viaticos/pendientes')
    }
  } else {
    navigateTo('/viaticos')
  }
}
const isImageFile = (url: string) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  const extension = getFileExtension(url).toLowerCase()
  return imageExtensions.includes(extension)
}
const isPdfFile = (url: string) => {
  const pdfExtensions = ['pdf']
  const extension = getFileExtension(url).toLowerCase()
  return pdfExtensions.includes(extension)
}
const getFileExtension = (url: string) => {
  const extension = url.split('.').pop()?.toLowerCase()
  return extension || ''
}

const hasPagos = computed(() => (viatico.value?.pagos?.length ?? 0) > 0)

const config = useRuntimeConfig()
function pagoUrl(pago: ViaticoPago): string | null {
  return pago.file_path
}
function isPagoImage(pago: ViaticoPago): boolean {
  const url = pagoUrl(pago)
  if (!url) return false
  const ext = (pago.file_extension || url.split('.').pop() || '').toLowerCase()
  const mime = (pago.file_mime_type || '').toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) || mime.startsWith('image/')
}
function isPagoPdf(pago: ViaticoPago): boolean {
  const ext = (pago.file_extension || '').toLowerCase()
  const mime = (pago.file_mime_type || '').toLowerCase()
  return ext === 'pdf' || mime.includes('pdf')
}
function openPagoFile(pago: ViaticoPago) {
  const url = pagoUrl(pago)
  if (!url) return
  const fileItem: FileItem = {
    id: pago.id,
    file_name: pago.file_original_name || pago.concepto || 'comprobante',
    file_url: url,
    type: isPagoImage(pago) ? 'image' : 'file',
    size: pago.file_size || 0,
    lastModified: 0,
    file_ext: pago.file_extension || 'pdf'
  }
  modalPreview.open({ file: fileItem, isOpen: true })
}

const openComprobanteModal = (url: string | null | undefined, name: string) => {
  if (!url) return
  
  const fileItem: FileItem = {
    id: 0,
    file_name: name,
    file_url: url,
    type: 'image',
    size: 0,
    lastModified: 0,
    file_ext: 'jpg'
  }
  
  modalPreview.open({
    file: fileItem,
    isOpen: true
  })
}

const handleDeleteFile = async () => {
  if (!viatico.value) return

  showConfirmation(
    'Eliminar Comprobante de Retribución',
    '¿Estás seguro de que deseas eliminar el comprobante de retribución? El estado cambiará a Pendiente.',
    async () => {
      try {
        deletingFile.value = true
        await withSpinner(async () => {
          const data: UpdateViaticoRequest = {
            payment_receipt_file: null,
            delete_file: true
          }
          await updateViatico(viatico.value!.id, data)
          showSuccess('Comprobante eliminado', 'El comprobante de retribución ha sido eliminado y el estado cambió a Pendiente')
          await loadViaticoById(viatico.value!.id)
        })
      } catch (err: any) {
        showError('Error al eliminar comprobante', err.message || 'Error desconocido')
      } finally {
        deletingFile.value = false
      }
    }
  )
}

const handleDeleteRetribucion = async (retribucionId: number) => {
  if (!viatico.value) return
  if (retribucionId === 0) {
    handleDeleteFile()
    return
  }
  showConfirmation(
    'Eliminar comprobante',
    '¿Estás seguro de que deseas eliminar este comprobante de retribución?',
    async () => {
      try {
        deletingRetribucionId.value = retribucionId
        await withSpinner(async () => {
          await updateViatico(viatico.value!.id, { delete_retribucion_id: retribucionId })
          showSuccess('Comprobante eliminado', 'El comprobante ha sido eliminado.')
          await loadViaticoById(viatico.value!.id)
        })
      } catch (err: any) {
        showError('Error al eliminar comprobante', err.message || 'Error desconocido')
      } finally {
        deletingRetribucionId.value = null
      }
    }
  )
}

const handleStatusChange = async (newStatus: string) => {
  if (!viatico.value || newStatus === viatico.value.status) return

  showConfirmation(
    'Cambiar Estado',
    `¿Estás seguro de que deseas cambiar el estado a ${statusOptions.find(s => s.value === newStatus)?.label}?`,
    async () => {
      try {
        await withSpinner(async () => {
          const data: UpdateViaticoRequest = {
            status: newStatus as 'PENDING' | 'CONFIRMED' | 'REJECTED'
          }
          await updateViatico(viatico.value!.id, data)
          showSuccess('Estado cambiado', 'El estado ha sido actualizado exitosamente')
          await loadViaticoById(viatico.value!.id)
        })
      } catch (err: any) {
        showError('Error al cambiar estado', err.message || 'Error desconocido')
        selectedStatus.value = viatico.value.status
      }
    },
    () => {
      selectedStatus.value = viatico.value!.status
    }
  )
}

onMounted(async () => {
  const id = parseInt(route.params.id as string)
  if (id) {
    selectedStatus.value = viatico.value?.status || ''
    await loadViaticoById(id)
    if (viatico.value) {
      selectedStatus.value = viatico.value.status
    }
  }
})

// Watch para actualizar selectedStatus cuando cambie el viatico
watch(() => viatico.value?.status, (newStatus) => {
  if (newStatus) {
    selectedStatus.value = newStatus
  }
})
</script>
