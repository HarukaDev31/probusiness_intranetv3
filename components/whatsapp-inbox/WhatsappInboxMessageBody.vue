<template>
  <div
    class="flex flex-col gap-1"
    :class="[
      rootAlign,
      mediaUrl ? 'w-[280px] max-w-full shrink-0' : 'min-w-0 max-w-full'
    ]"
  >
    <button
      v-if="replyPreview"
      type="button"
      class="mb-0.5 min-w-0 max-w-[min(100%,320px)] text-left"
      :class="replyBtnClass"
      @click.stop="emit('scroll-to-reply', replyPreview.metaId)"
    >
      <SoporteTiChatReplyPreview
        :remitente="replyPreview.label"
        :texto="replyPreview.text"
        :imagen-url="replyPreview.imageUrl"
        :inverted="direction === 'out'"
      />
    </button>

    <p
      v-if="msg.is_template && msg.template_name"
      class="text-[10px] font-semibold uppercase text-info"
    >
      {{ msg.template_name }}
    </p>

    <div
      v-if="mediaUrl"
      class="w-full"
      :class="direction === 'out' ? 'self-end' : 'self-start'"
    >
      <button
        v-if="showAsImage"
        type="button"
        class="block w-full overflow-hidden rounded-lg ring-1 ring-default/40"
        @click.stop="() => abrirMedia()"
      >
        <img
          :src="mediaUrl"
          :alt="mediaNombre"
          class="aspect-[4/3] max-h-52 w-full object-cover"
          loading="lazy"
          @load="onMediaRendered"
        >
      </button>
      <WhatsappInboxVideoBubble
        v-else-if="msg.message_type === 'video'"
        class="w-full"
        :url="mediaUrl"
        :nombre="mediaNombre"
        :caption="videoCaption"
        :inverted="direction === 'out'"
        @abrir="abrirMedia()"
        @media-ready="onMediaRendered"
      />
      <button
        v-else-if="msg.message_type === 'audio'"
        type="button"
        class="flex max-w-full items-center gap-2 rounded-lg px-3 py-2 ring-1"
        :class="
          direction === 'out'
            ? 'bg-primary text-inverted ring-primary-600/40'
            : 'bg-elevated/80 ring-default/50'
        "
        @click.stop="() => abrirMedia()"
      >
        <UIcon
          name="i-heroicons-musical-note"
          class="size-8 shrink-0"
          :class="direction === 'out' ? 'text-inverted' : 'text-primary'"
        />
        <span class="truncate text-sm">Audio</span>
      </button>
      <WhatsappInboxDocumentBubble
        v-else-if="showDocumentBubble"
        class="w-full"
        :url="mediaUrl"
        :nombre="mediaNombre"
        :caption="captionEnBurbuja"
        :size-bytes="msg.media_size_bytes"
        :inverted="direction === 'out'"
        @abrir="abrirMedia()"
      />
      <div
        v-else
        class="w-full overflow-hidden rounded-lg ring-1"
        :class="
          direction === 'out'
            ? 'bg-primary text-inverted ring-primary-600/30'
            : 'ring-default/40'
        "
      >
        <SoporteTiChatAdjuntoMensaje
          :url="mediaUrl"
          :nombre="mediaNombre"
          :inverted="direction === 'out'"
          forzar-documento
          @abrir="abrirMedia"
        />
      </div>
    </div>

    <div
      v-else-if="isMediaTypeWithoutUrl"
      class="flex w-[280px] max-w-full shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm ring-1"
      :class="
        direction === 'out'
          ? 'bg-primary text-inverted ring-primary-600/40'
          : 'bg-elevated/80 text-muted ring-default/40'
      "
    >
      <UIcon :name="mediaPlaceholderIcon" class="size-8 shrink-0" />
      <span>{{ mediaPlaceholderLabel }}</span>
    </div>

    <div
      v-if="textoVisible"
      class="min-w-0 w-full max-w-[min(100%,320px)] whitespace-pre-wrap break-words px-3 py-2 text-sm leading-relaxed shadow-sm [overflow-wrap:anywhere] rounded-2xl"
      :class="
        direction === 'out'
          ? 'rounded-br-sm bg-primary text-inverted'
          : 'rounded-bl-sm bg-elevated text-highlighted ring-1 ring-default/40'
      "
    >
      {{ msg.body }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOverlay } from '#imports'
import type { WaInboxMessage } from '~/types/whatsapp-inbox'
import type { FileItem } from '~/types/commons/file'
import SoporteTiChatReplyPreview from '~/components/soporte-ti/SoporteTiChatReplyPreview.vue'
import SoporteTiChatAdjuntoMensaje from '~/components/soporte-ti/SoporteTiChatAdjuntoMensaje.vue'
import WhatsappInboxDocumentBubble from '~/components/whatsapp-inbox/WhatsappInboxDocumentBubble.vue'
import WhatsappInboxVideoBubble from '~/components/whatsapp-inbox/WhatsappInboxVideoBubble.vue'
import ModalPreview from '~/components/commons/ModalPreview.vue'
import { esImagenInlineAdjunto, extensionAdjunto } from '~/utils/soporteTiChatAdjunto'

const props = defineProps<{
  msg: WaInboxMessage
  direction: 'in' | 'out'
  replyPreview?: {
    metaId: string
    label: string
    text: string
    imageUrl?: string | null
  } | null
}>()

const emit = defineEmits<{
  'scroll-to-reply': [metaId: string]
  'media-rendered': []
}>()

const overlay = useOverlay()
const modalPreview = overlay.create(ModalPreview)

const mediaUrl = computed(() => props.msg.media_url?.trim() || '')
const mediaNombre = computed(
  () => props.msg.media_filename?.trim() || nombreDesdeUrl(mediaUrl.value) || 'Archivo'
)

const showAsImage = computed(() => {
  if (!mediaUrl.value) return false
  if (props.msg.message_type === 'image') return true
  return esImagenInlineAdjunto(mediaNombre.value, props.msg.media_mime || undefined)
})

const showDocumentBubble = computed(() => {
  if (!mediaUrl.value || showAsImage.value) return false
  if (props.msg.message_type === 'video' || props.msg.message_type === 'audio') return false
  if (
    props.msg.message_type === 'document' ||
    props.msg.message_type === 'template' ||
    props.msg.is_template
  ) {
    return true
  }
  return !esImagenInlineAdjunto(mediaNombre.value, props.msg.media_mime || undefined)
})

function isBracketMediaPlaceholder(body: string) {
  return /^\[(image|video|document|audio|sticker)\]$/i.test(body.trim())
}

const captionEnBurbuja = computed(() => {
  const t = props.msg.body?.trim() || ''
  if (!t || t === mediaNombre.value || isBracketMediaPlaceholder(t)) return ''
  return t
})

const videoCaption = computed(() =>
  props.msg.message_type === 'video' ? captionEnBurbuja.value : ''
)

const isMediaTypeWithoutUrl = computed(() => {
  const type = props.msg.message_type
  if (!type || mediaUrl.value) return false
  return ['image', 'video', 'document', 'audio'].includes(type)
})

const mediaPlaceholderIcon = computed(() => {
  const type = props.msg.message_type
  if (type === 'image') return 'i-heroicons-photo'
  if (type === 'video') return 'i-heroicons-film'
  if (type === 'audio') return 'i-heroicons-musical-note'
  return 'i-heroicons-document'
})

const mediaPlaceholderLabel = computed(() => {
  const type = props.msg.message_type
  if (type === 'image') return 'Imagen no disponible'
  if (type === 'video') return 'Video no disponible'
  if (type === 'audio') return 'Audio no disponible'
  return 'Archivo no disponible'
})

const textoVisible = computed(() => {
  const t = props.msg.body?.trim() || ''
  if (!t || isBracketMediaPlaceholder(t)) return false
  if (isMediaTypeWithoutUrl.value) return false
  if (mediaUrl.value) {
    if (showAsImage.value && !captionEnBurbuja.value) return false
    if (props.msg.message_type === 'video' && !videoCaption.value) return false
    if (showDocumentBubble.value && !captionEnBurbuja.value) return false
    if (props.msg.message_type === 'audio') return false
    if (t === mediaNombre.value) return false
  }
  if (showDocumentBubble.value && captionEnBurbuja.value) return false
  if (props.msg.is_template && !mediaUrl.value && t.length < 3) return true
  return true
})

const rootAlign = computed(() =>
  props.direction === 'out' ? 'items-end' : 'items-start'
)

const replyBtnClass = computed(() =>
  props.direction === 'out' ? 'self-end' : 'self-start'
)

function nombreDesdeUrl(url: string) {
  const base = url.split('?')[0] || ''
  const part = base.split('/').pop() || 'archivo'
  try {
    return decodeURIComponent(part)
  } catch {
    return part
  }
}

function isUsableMediaUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const t = value.trim()
  if (!t || t.includes('[object')) return false
  return (
    t.startsWith('http://')
    || t.startsWith('https://')
    || t.startsWith('blob:')
    || t.startsWith('/')
  )
}

function onMediaRendered() {
  emit('media-rendered')
}

function abrirMedia(url?: string, nombre?: string) {
  const u = isUsableMediaUrl(url) ? url.trim() : mediaUrl.value
  if (!u) return
  let n = typeof nombre === 'string' && nombre.trim() ? nombre.trim() : mediaNombre.value
  const esVideoMsg = props.msg.message_type === 'video'
  let ext = extensionAdjunto(n)
  if (esVideoMsg && !ext) {
    ext = 'mp4'
    if (!/\.\w{2,5}$/i.test(n)) {
      n = `${n}.mp4`
    }
  }
  const esImg = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
  const esVideo = esVideoMsg || ['mp4', 'webm', 'mov', 'm4v', 'mkv'].includes(ext)
  const fileItem: FileItem = {
    id: 0,
    file_name: n,
    file_url: u,
    type: esImg ? 'image' : esVideo ? 'video' : 'file',
    size: 0,
    lastModified: 0,
    file_ext: ext,
    content_type: props.msg.media_mime || (esVideo ? 'video/mp4' : null)
  }
  modalPreview.open({ file: fileItem, isOpen: true })
}
</script>
