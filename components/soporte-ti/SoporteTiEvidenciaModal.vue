<template>
  <UModal :open="open" @update:open="onUpdateOpen" class="sm:max-w-3xl">
    <template #header>
      <div class="flex w-full flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-document-duplicate" class="size-5 text-primary-500" />
          <h2 class="text-[15px] font-semibold text-slate-800 dark:text-slate-100">
            Evidencias{{ ticket ? ` — ${ticket.codigo}` : '' }}
          </h2>
          <UBadge v-if="itemsImagen.length" color="primary" variant="soft" size="sm">
            {{ itemsImagen.length }} {{ itemsImagen.length === 1 ? 'archivo' : 'archivos' }}
          </UBadge>
        </div>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-x-mark"
          size="sm"
          @click="cerrar"
        />
      </div>
    </template>
    <template #body>
      <div v-if="!ticket" class="text-sm text-slate-500">Sin datos.</div>
      <div v-else class="max-h-[70vh] space-y-6 overflow-y-auto p-1 text-sm">
        <div>
          <p class="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Registro de evidencias (solicitud)
          </p>
          <div v-if="evidenciasOrdenadas.length" class="space-y-4">
            <template v-for="(ev, idx) in evidenciasOrdenadas" :key="ev.id ?? `${ev.tipo}-${idx}`">
              <div
                v-if="ev.tipo === 'texto' && ev.texto"
                class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-600 dark:bg-slate-800/50"
              >
                <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Texto</p>
                <p class="mt-1 whitespace-pre-wrap text-slate-800 dark:text-slate-100">{{ ev.texto }}</p>
              </div>
              <div
                v-else-if="ev.tipo === 'imagen' && ev.url"
                class="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"
              >
                <div
                  class="border-b border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                >
                  <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {{ ev.nombre || 'Imagen' }}
                  </span>
                </div>
                <div class="p-3">
                  <div
                    v-if="isImageEv(ev)"
                    class="relative flex min-h-[160px] max-h-[280px] items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700"
                  >
                    <img
                      :src="ev.url"
                      :alt="ev.nombre || ''"
                      class="max-h-[280px] w-full cursor-pointer object-contain transition hover:opacity-90"
                      @click="openArchivo(ev, idx)"
                    />
                    <div class="absolute bottom-2 right-2">
                      <UButton
                        size="xs"
                        color="neutral"
                        variant="solid"
                        icon="i-heroicons-arrows-pointing-out"
                        title="Ver en pantalla completa"
                        @click.stop="openArchivo(ev, idx)"
                      />
                    </div>
                  </div>
                  <div
                    v-else-if="isPdfEv(ev)"
                    class="flex flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <iframe
                      :src="ev.url"
                      class="h-[240px] w-full border-0 bg-gray-100 dark:bg-gray-700"
                      title="Vista previa PDF"
                    />
                    <div
                      class="flex items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-800"
                    >
                      <UButton
                        size="xs"
                        color="primary"
                        variant="soft"
                        icon="i-heroicons-arrows-pointing-out"
                        @click="openArchivo(ev, idx)"
                      >
                        Pantalla completa
                      </UButton>
                    </div>
                  </div>
                  <div v-else class="flex flex-col items-center justify-center gap-2 py-6">
                    <UButton
                      size="xs"
                      color="primary"
                      variant="soft"
                      icon="i-heroicons-arrow-top-right-on-square"
                      @click="openArchivo(ev, idx)"
                    >
                      Abrir archivo
                    </UButton>
                  </div>
                  <p v-if="ev.tamano" class="mt-2 text-[10px] text-gray-500 dark:text-gray-400">
                    {{ ev.tamano }}
                  </p>
                </div>
              </div>
            </template>
          </div>
          <div
            v-else
            class="rounded-lg border border-dashed border-gray-300 py-10 text-center dark:border-gray-600"
          >
            <UIcon name="i-heroicons-photo" class="mx-auto mb-2 size-12 text-gray-300 dark:text-gray-600" />
            <p class="text-sm text-gray-500 dark:text-gray-400">
              No hay evidencias registradas para esta solicitud.
            </p>
          </div>
        </div>

        <div v-if="ticket.maqueta?.dataUrl" class="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-600">
          <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Maqueta</p>
          <img
            :src="ticket.maqueta.dataUrl"
            :alt="ticket.maqueta.nombre"
            class="max-h-72 w-full rounded-lg border border-slate-200 object-contain dark:border-slate-600"
          />
          <p class="text-xs text-slate-600 dark:text-slate-300">
            {{ ticket.maqueta.nombre }} · {{ ticket.maqueta.tamano }}
          </p>
        </div>

        <div v-if="ticket.descripcion?.trim()" class="space-y-1 border-t border-slate-200 pt-4 dark:border-slate-600">
          <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Descripción</p>
          <p class="whitespace-pre-wrap text-slate-700 dark:text-slate-200">{{ ticket.descripcion }}</p>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SoporteTiEvidenciaItem, SoporteTiSolicitud } from '~/types/soporteTi'
import type { FileItem } from '~/types/commons/file'
import ModalPreview from '~/components/commons/ModalPreview.vue'

const props = defineProps<{
  open: boolean
  ticket: SoporteTiSolicitud | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const evidenciasOrdenadas = computed(() => {
  const list = props.ticket?.evidencias ?? []
  return [...list].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
})

const itemsImagen = computed(() => evidenciasOrdenadas.value.filter((e) => e.tipo === 'imagen' && e.url))

const overlay = useOverlay()
const modalPreview = overlay.create(ModalPreview)

function extensionDesde(ev: SoporteTiEvidenciaItem): string {
  const url = ev.url || ''
  const base = url.split('?')[0] || ''
  return (ev.nombre?.split('.').pop() || base.split('.').pop() || '').toLowerCase()
}

function isImageEv(ev: SoporteTiEvidenciaItem): boolean {
  const url = ev.url || ''
  if (url.startsWith('blob:')) return true
  const mime = (ev.mime || '').toLowerCase()
  if (mime.startsWith('image/')) return true
  const ext = extensionDesde(ev)
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
}

function isPdfEv(ev: SoporteTiEvidenciaItem): boolean {
  const mime = (ev.mime || '').toLowerCase()
  if (mime.includes('pdf')) return true
  return extensionDesde(ev) === 'pdf'
}

function openArchivo(ev: SoporteTiEvidenciaItem, index: number) {
  if (!ev.url) return
  const ext = extensionDesde(ev) || 'bin'
  const fileItem: FileItem = {
    id: ev.id ?? index,
    file_name: ev.nombre || `evidencia-${index + 1}`,
    file_url: ev.url,
    type: isImageEv(ev) ? 'image' : 'file',
    size: 0,
    lastModified: 0,
    file_ext: ext
  }
  modalPreview.open({ file: fileItem, isOpen: true })
}

function cerrar() {
  emit('update:open', false)
}

function onUpdateOpen(v: boolean) {
  emit('update:open', v)
}
</script>
