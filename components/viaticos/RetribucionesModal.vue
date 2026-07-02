<template>
  <UModal>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-banknotes" class="w-5 h-5 text-primary-500" />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Retribuciones</h2>
        <UBadge v-if="retribuciones.length" color="primary" variant="soft" size="sm">{{ retribuciones.length }} {{ retribuciones.length === 1 ? 'comprobante' : 'comprobantes' }}</UBadge>
      </div>
    </template>

    <template #body>
      <div class="p-4 max-h-[70vh] overflow-y-auto">
        <div class="grid grid-cols-1 sm:grid-cols-1 gap-4">
          <div
            v-for="(item, index) in retribuciones"
            :key="item.id"
            class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden transition hover:border-primary-300 dark:hover:border-primary-600"
          >
            <!-- Número de item -->
            <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between gap-2 flex-wrap">
              <span class="flex items-center gap-2 min-w-0">
                <span class="flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-sm font-semibold flex-shrink-0">{{ index + 1 }}</span>
                <span v-if="item.banco" class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{{ item.banco }}</span>
                <span v-else class="text-sm text-gray-500 dark:text-gray-400">Comprobante de retribución</span>
              </span>
              <UBadge v-if="item.sended_at" color="success" variant="soft" size="xs" class="flex-shrink-0">
                <UIcon name="i-heroicons-chat-bubble-left-right" class="w-3.5 h-3.5 mr-1" />
                Enviado {{ formatDateTimeToDmy(item.sended_at) }}
              </UBadge>
            </div>

            <div class="p-4 space-y-3">
              <div class="flex flex-wrap gap-3">
                <div v-if="item.monto != null" class="flex items-baseline gap-1">
                  <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Monto</span>
                  <span class="text-lg font-semibold text-primary-600 dark:text-primary-400">{{ formatCurrency(Number(item.monto), 'PEN') }}</span>
                </div>
                <div v-if="item.created_at" class="flex items-baseline gap-1">
                  <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fecha de subida</span>
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ formatDateTimeToDmy(item.created_at) }}</span>
                </div>
              </div>

              <!-- Comprobante: vista previa imagen o PDF -->
              <div class="mt-3">
                <div v-if="retribucionUrl(item)" class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                  <!-- Vista previa imagen -->
                  <div v-if="isImageUrl(item)" class="relative bg-gray-100 dark:bg-gray-700 flex items-center justify-center min-h-[200px] max-h-[320px]">
                    <img
                      :src="retribucionUrl(item)!"
                      :alt="item.file_original_name || 'Comprobante'"
                      class="w-full h-full max-h-[320px] object-contain cursor-pointer hover:opacity-90 transition rounded-b-lg"
                      @click="openFile(item)"
                    />
                    <div class="absolute bottom-2 right-2">
                      <UButton
                        size="xs"
                        color="neutral"
                        variant="solid"
                        icon="i-heroicons-arrows-pointing-out"
                        title="Ver en pantalla completa"
                        @click.stop="openFile(item)"
                      />
                    </div>
                  </div>

                  <!-- Vista previa PDF -->
                  <div v-else-if="isPdfUrl(item)" class="flex flex-col">
                    <iframe
                      :src="retribucionUrl(item)!"
                      class="w-full h-[320px] rounded-t-lg border-0 bg-gray-100 dark:bg-gray-700"
                      title="Vista previa PDF"
                    />
                    <div class="p-2 flex items-center justify-between gap-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                      <p class="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">{{ item.file_original_name || 'Comprobante PDF' }}</p>
                      <UButton
                        size="xs"
                        color="primary"
                        variant="soft"
                        icon="i-heroicons-arrows-pointing-out"
                        @click="openFile(item)"
                      >
                        Pantalla completa
                      </UButton>
                    </div>
                  </div>
                  <!-- Otro archivo (sin preview) -->
                  <div v-else class="p-4 flex flex-col items-center justify-center gap-2 min-h-[100px]">
                    <UIcon name="i-heroicons-document" class="w-10 h-10 text-gray-400 dark:text-gray-500" />
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-full px-2">{{ item.file_original_name || 'Comprobante' }}</p>
                    <UButton
                      size="xs"
                      color="primary"
                      variant="soft"
                      icon="i-heroicons-arrow-top-right-on-square"
                      @click="openFile(item)"
                    >
                      Ver comprobante
                    </UButton>
                  </div>
                </div>
                <div v-else class="p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-2 min-h-[80px]">
                  <UIcon name="i-heroicons-document-minus" class="w-8 h-8 text-gray-400" />
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.file_original_name || 'Sin archivo' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Estado vacío -->
        <div v-if="!retribuciones.length" class="text-center py-12">
          <UIcon name="i-heroicons-banknotes" class="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p class="text-gray-500 dark:text-gray-400">No hay retribuciones para mostrar.</p>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { formatCurrency, formatDateTimeToDmy } from '~/utils/formatters'
import type { ViaticoRetribucion } from '~/types/viatico'
import type { FileItem } from '~/types/commons/file'
import ModalPreview from '~/components/commons/ModalPreview.vue'

type RetribucionItem = ViaticoRetribucion & { file_url?: string | null }

withDefaults(
  defineProps<{
    retribuciones: RetribucionItem[]
    subject?: string
  }>(),
  { retribuciones: () => [], subject: '' }
)

const overlay = useOverlay()
const modalPreview = overlay.create(ModalPreview)

function getFileExtension(url: string): string {
  return url.split('.').pop()?.toLowerCase() || ''
}

function retribucionUrl(item: RetribucionItem): string | null {
  return item.file_url ?? item.file_path ?? null
}

function isImageUrl(item: RetribucionItem): boolean {
  const url = retribucionUrl(item)
  if (!url) return false
  const ext = getFileExtension(url)
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)
}

function isPdfUrl(item: RetribucionItem): boolean {
  const url = retribucionUrl(item)
  if (!url) return false
  const ext = getFileExtension(url)
  return ext === 'pdf'
}

function openFile(item: RetribucionItem) {
  const url = retribucionUrl(item)
  if (!url) return
  const fileItem: FileItem = {
    id: item.id,
    file_name: item.file_original_name || 'Comprobante',
    file_url: url,
    type: isImageUrl(item) ? 'image' : (getFileExtension(url) === 'pdf' ? 'pdf' : 'file'),
    size: 0,
    lastModified: 0,
    file_ext: getFileExtension(url)
  }
  modalPreview.open({ file: fileItem, isOpen: true })
}
</script>
