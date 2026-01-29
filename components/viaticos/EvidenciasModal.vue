<template>
  <UModal>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-document-duplicate" class="w-5 h-5 text-primary-500" />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Evidencias</h2>
        <UBadge v-if="pagos.length" color="primary" variant="soft" size="sm">{{ pagos.length }} {{ pagos.length === 1 ? 'comprobante' : 'comprobantes' }}</UBadge>
      </div>
    </template>

    <template #body>
      <div class="p-4 max-h-[70vh] overflow-y-auto">
        <div class="grid grid-cols-1 sm:grid-cols-1 gap-4">
          <div
            v-for="(pago, index) in pagos"
            :key="pago.id"
            class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden transition hover:border-primary-300 dark:hover:border-primary-600"
          >
            <!-- Número de item -->
            <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center gap-2">
              <span class="flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-sm font-semibold">{{ index + 1 }}</span>
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{{ pago.concepto }}</span>
            </div>

            <div class="p-4 space-y-3">
              <div class="flex items-baseline justify-between gap-2">
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Monto</span>
                <span class="text-lg font-semibold text-primary-600 dark:text-primary-400">{{ formatCurrency(Number(pago.monto), 'PEN') }}</span>
              </div>

              <!-- Comprobante: vista previa imagen o PDF -->
              <div class="mt-3">
             
                <div v-if="pagoUrl(pago)" class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                  <!-- Vista previa imagen -->
                  <div v-if="isImageUrl(pago)" class="relative bg-gray-100 dark:bg-gray-700 flex items-center justify-center min-h-[200px] max-h-[320px]">
                    <img
                      :src="pagoUrl(pago)!"
                      :alt="pago.file_original_name || pago.concepto"
                      class="w-full h-full max-h-[320px] object-contain cursor-pointer hover:opacity-90 transition rounded-b-lg"
                      @click="openFile(pago)"
                    />
                    <div class="absolute bottom-2 right-2">
                      <UButton
                        size="xs"
                        color="neutral"
                        variant="solid"
                        icon="i-heroicons-arrows-pointing-out"
                        title="Ver en pantalla completa"
                        @click.stop="openFile(pago)"
                      />
                    </div>
                  </div>
                  
                  <!-- Vista previa PDF -->
                  <div v-else-if="isPdfUrl(pago)" class="flex flex-col">
                    <iframe
                      :src="pagoUrl(pago)!"
                      class="w-full h-[320px] rounded-t-lg border-0 bg-gray-100 dark:bg-gray-700"
                      title="Vista previa PDF"
                    />
                    <div class="p-2 flex items-center justify-between gap-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                      <p class="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">{{ pago.file_original_name || 'Comprobante PDF' }}</p>
                      <UButton
                        size="xs"
                        color="primary"
                        variant="soft"
                        icon="i-heroicons-arrows-pointing-out"
                        @click="openFile(pago)"
                      >
                        Pantalla completa
                      </UButton>
                    </div>
                  </div>
                  <!-- Otro archivo (sin preview) -->
                  <div v-else class="p-4 flex flex-col items-center justify-center gap-2 min-h-[100px]">
                    <UIcon name="i-heroicons-document" class="w-10 h-10 text-gray-400 dark:text-gray-500" />
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-full px-2">{{ pago.file_original_name || 'Comprobante' }}</p>
                    <UButton
                      size="xs"
                      color="primary"
                      variant="soft"
                      icon="i-heroicons-arrow-top-right-on-square"
                      @click="openFile(pago)"
                    >
                      Ver comprobante
                    </UButton>
                  </div>

                </div>
                <div v-else class="p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-2 min-h-[80px]">
                  <UIcon name="i-heroicons-document-minus" class="w-8 h-8 text-gray-400" />
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ pago.file_original_name || 'Sin archivo' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Estado vacío -->
        <div v-if="!pagos.length" class="text-center py-12">
          <UIcon name="i-heroicons-document-minus" class="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p class="text-gray-500 dark:text-gray-400">No hay evidencias para mostrar.</p>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { formatCurrency } from '~/utils/formatters'
import type { ViaticoPago } from '~/types/viatico'
import type { FileItem } from '~/types/commons/file'
import ModalPreview from '~/components/commons/ModalPreview.vue'

withDefaults(
  defineProps<{
    pagos: ViaticoPago[]
    subject?: string
  }>(),
  { pagos: () => [], subject: '' }
)

const overlay = useOverlay()
const modalPreview = overlay.create(ModalPreview)

function pagoUrl(pago: ViaticoPago): string | null {
  return pago.file_path
}

function isImageUrl(pago: ViaticoPago): boolean {
  const url = pagoUrl(pago)
  if (!url) return false
  const ext = (pago.file_extension || url.split('.').pop() || '').toLowerCase()
  const mime = (pago.file_mime_type || '').toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) || mime.startsWith('image/')
}

function isPdfUrl(pago: ViaticoPago): boolean {
  const ext = (pago.file_extension || '').toLowerCase()
  const mime = (pago.file_mime_type || '').toLowerCase()
  return ext === 'pdf' || mime.includes('pdf')
}

function openFile(pago: ViaticoPago) {
  const url = pagoUrl(pago)
  if (!url) return
  const fileItem: FileItem = {
    id: pago.id,
    file_name: pago.file_original_name || pago.concepto || 'comprobante',
    file_url: url,
    type: isImageUrl(pago) ? 'image' : 'file',
    size: pago.file_size || 0,
    lastModified: 0,
    file_ext: pago.file_extension || 'pdf'
  }
  modalPreview.open({ file: fileItem, isOpen: true })
}
</script>
