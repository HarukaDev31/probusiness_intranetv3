<template>
  <UModal
    v-model:open="isOpen"
    class="sm:max-w-2xl"
    :dismissible="false"
    :close="false"
    @update:open="onOpenChange"
  >
    <template #header>
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Enviar WhatsApp — Cobranza
        </h3>
        <p class="text-sm text-gray-500 mt-1">
          Cotización #{{ idCotizacion }}
          <span v-if="meta?.cliente"> · {{ meta.cliente }}</span>
          <span v-if="meta?.carga"> · Carga {{ meta.carga }}</span>
        </p>
        <p class="text-xs text-gray-400 mt-0.5">
          Vista previa del texto y del adjunto (PDF/imagen). Todas vienen seleccionadas; desmarca las que no quieras.
        </p>
      </div>
    </template>

    <template #body>
      <div class="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
        <label
          v-for="tpl in templates"
          :key="tpl.key"
          class="block rounded-xl border px-3 py-3 cursor-pointer transition-colors"
          :class="selected.includes(tpl.key)
            ? 'border-primary-400 bg-primary-50/40 dark:bg-primary-900/10'
            : 'border-gray-200 dark:border-gray-700 opacity-70'"
        >
          <div class="flex items-start gap-3 mb-2">
            <UCheckbox
              :model-value="selected.includes(tpl.key)"
              @update:model-value="(v: boolean | 'indeterminate') => toggle(tpl.key, v === true)"
            />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-sm font-semibold text-gray-900 dark:text-white">
                  {{ tpl.order ? `${tpl.order}. ` : '' }}{{ tpl.label }}
                </p>
                <UBadge v-if="tpl.has_media" color="primary" variant="soft" size="sm">
                  {{ tpl.media_label || 'Adjunto' }}
                </UBadge>
              </div>
              <p class="text-[11px] text-gray-400 mt-0.5 font-mono truncate">{{ tpl.key }}</p>
            </div>
          </div>

          <!-- Burbuja estilo chat -->
          <div class="ml-8 rounded-2xl rounded-tl-sm bg-[#dcf8c6] dark:bg-emerald-900/40 px-3 py-2 shadow-sm">
            <p class="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
              {{ tpl.preview || tpl.description }}
            </p>

            <div v-if="tpl.has_media" class="mt-2 space-y-1.5" @click.stop.prevent>
              <p class="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                <UIcon name="i-heroicons-paper-clip" class="w-3.5 h-3.5" />
                {{ tpl.media_label || 'Archivo adjunto' }}
              </p>

              <div
                v-if="mediaState[tpl.key]?.loading"
                class="flex items-center gap-2 text-xs text-gray-500 py-6 justify-center rounded-lg bg-white/60 dark:bg-black/20"
              >
                <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                Cargando vista previa…
              </div>

              <p
                v-else-if="mediaState[tpl.key]?.error"
                class="text-xs text-red-600 dark:text-red-400 py-2"
              >
                {{ mediaState[tpl.key]?.error }}
              </p>

              <template v-else-if="mediaState[tpl.key]?.src">
                <img
                  v-if="isImage(tpl)"
                  :src="mediaState[tpl.key]!.src!"
                  :alt="tpl.media_label || 'Imagen adjunta'"
                  class="w-full max-h-56 object-contain rounded-lg border border-black/5 bg-white cursor-zoom-in"
                  @click="openMedia(tpl)"
                >
                <iframe
                  v-else-if="isPdf(tpl)"
                  :src="mediaState[tpl.key]!.src!"
                  class="w-full h-72 rounded-lg border border-black/5 bg-white"
                  title="Vista previa PDF"
                />
                <div class="flex justify-end">
                  <UButton
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    :label="isPdf(tpl) ? 'Abrir PDF' : 'Ampliar imagen'"
                    icon="i-heroicons-arrow-top-right-on-square"
                    @click="openMedia(tpl)"
                  />
                </div>
              </template>

              <p v-else class="text-xs text-gray-500 italic">
                Sin vista previa del adjunto
              </p>
            </div>
          </div>
        </label>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-between items-center gap-2 w-full">
        <p class="text-xs text-gray-500">
          {{ selected.length }} de {{ templates.length }} seleccionada{{ selected.length === 1 ? '' : 's' }}
        </p>
        <div class="flex gap-2">
          <UButton color="neutral" variant="outline" label="Solo guardar estado" :disabled="loading" @click="skip" />
          <UButton
            color="primary"
            :label="selected.length ? `Enviar (${selected.length})` : 'Enviar'"
            :loading="loading"
            :disabled="!selected.length"
            @click="confirm"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onBeforeUnmount } from 'vue'
import type { CobranzaWhatsappTemplate, CobranzaWhatsappPreviewMeta } from '~/types/cargaconsolidada/cotizacion-final/general'
import { GeneralService } from '~/services/cargaconsolidada/cotizacion-final/generalService'

const props = defineProps<{
  open: boolean
  idCotizacion: number | null
  templates: CobranzaWhatsappTemplate[]
  meta?: CobranzaWhatsappPreviewMeta | null
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [templates: string[]]
  skip: []
}>()

const selected = ref<string[]>([])
const mediaState = reactive<Record<string, { loading: boolean; src: string | null; error: string | null; blobUrl?: boolean }>>({})
const objectUrls = ref<string[]>([])

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v),
})

const config = useRuntimeConfig()

const isPdf = (tpl: CobranzaWhatsappTemplate) =>
  (tpl.media_type || '').toLowerCase() === 'pdf' || (tpl.media_label || '').toLowerCase().includes('pdf')

const isImage = (tpl: CobranzaWhatsappTemplate) =>
  (tpl.media_type || '').toLowerCase() === 'image' || (!isPdf(tpl) && !!tpl.media_url)

const resolvePublicUrl = (url: string): string => {
  if (/^https?:\/\//i.test(url) || url.startsWith('blob:')) return url
  const base = String(config.public.apiBaseUrl || '').replace(/\/$/, '')
  return `${base}/${url.replace(/^\//, '')}`
}

const revokeMedia = () => {
  for (const u of objectUrls.value) {
    try {
      window.URL.revokeObjectURL(u)
    } catch (_e) {
      // ignore
    }
  }
  objectUrls.value = []
  for (const key of Object.keys(mediaState)) {
    delete mediaState[key]
  }
}

const loadMediaPreviews = async () => {
  revokeMedia()
  if (!props.open) return

  for (const tpl of props.templates) {
    if (!tpl.has_media) continue

    mediaState[tpl.key] = { loading: true, src: null, error: null }

    try {
      if (isImage(tpl) && tpl.media_url) {
        mediaState[tpl.key] = {
          loading: false,
          src: resolvePublicUrl(tpl.media_url),
          error: null,
        }
        continue
      }

      if (isPdf(tpl)) {
        const id = props.idCotizacion || tpl.id_cotizacion
        if (!id) {
          mediaState[tpl.key] = { loading: false, src: null, error: 'Sin id de cotización para el PDF' }
          continue
        }
        const raw = await GeneralService.downloadCotizacionFinalPDF(id)
        const pdfBlob = raw instanceof Blob
          ? raw
          : new Blob([raw as BlobPart], { type: 'application/pdf' })
        if (pdfBlob.type && pdfBlob.type.includes('json')) {
          throw new Error('No se pudo generar el PDF de boleta')
        }
        const objectUrl = window.URL.createObjectURL(pdfBlob)
        objectUrls.value.push(objectUrl)
        mediaState[tpl.key] = { loading: false, src: objectUrl, error: null, blobUrl: true }
        continue
      }

      mediaState[tpl.key] = { loading: false, src: null, error: 'Tipo de adjunto no soportado' }
    } catch (e: any) {
      mediaState[tpl.key] = {
        loading: false,
        src: null,
        error: e?.message || 'No se pudo cargar la vista previa del adjunto',
      }
    }
  }
}

const openMedia = (tpl: CobranzaWhatsappTemplate) => {
  const src = mediaState[tpl.key]?.src
  if (!src) return
  window.open(src, '_blank', 'noopener,noreferrer')
}

watch(
  () => [props.open, props.templates, props.idCotizacion] as const,
  ([open]) => {
    if (open) {
      selected.value = props.templates
        .filter((t) => t.selected_by_default !== false)
        .map((t) => t.key)
      loadMediaPreviews()
    } else {
      revokeMedia()
    }
  },
  { immediate: true, deep: true }
)

onBeforeUnmount(() => {
  revokeMedia()
})

const toggle = (key: string, on: boolean) => {
  if (on) {
    if (!selected.value.includes(key)) selected.value = [...selected.value, key]
  } else {
    selected.value = selected.value.filter((k) => k !== key)
  }
}

const onOpenChange = (v: boolean) => {
  emit('update:open', v)
}

const confirm = () => {
  emit('confirm', [...selected.value])
}

const skip = () => {
  emit('skip')
}
</script>
