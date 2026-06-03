<template>
  <div class="flex min-w-0 max-w-full flex-col gap-1" :class="rootAlign">
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

    <div v-if="mediaUrl" class="max-w-[min(100%,280px)]">
      <button
        v-if="showAsImage"
        type="button"
        class="block overflow-hidden rounded-lg ring-1 ring-default/40"
        @click.stop="abrirMedia"
      >
        <img
          :src="mediaUrl"
          :alt="mediaNombre"
          class="max-h-52 w-full object-cover"
          loading="lazy"
        >
      </button>
      <WhatsappInboxVideoBubble
        v-else-if="msg.message_type === 'video'"
        :url="mediaUrl"
        :nombre="mediaNombre"
        :caption="videoCaption"
        :inverted="direction === 'out'"
        @abrir="abrirMedia()"
      />
      <button
        v-else-if="msg.message_type === 'audio'"
        type="button"
        class="flex max-w-full items-center gap-2 rounded-lg bg-elevated/80 px-3 py-2 ring-1 ring-default/50"
        @click.stop="abrirMedia"
      >
        <UIcon name="i-heroicons-musical-note" class="size-8 shrink-0 text-primary" />
        <span class="truncate text-sm">Audio</span>
      </button>
      <WhatsappInboxDocumentBubble
        v-else-if="showDocumentBubble"
        :url="mediaUrl"
        :nombre="mediaNombre"
        :caption="captionEnBurbuja"
        :inverted="direction === 'out'"
        @abrir="abrirMedia()"
      />
      <SoporteTiChatAdjuntoMensaje
        v-else
        :url="mediaUrl"
        :nombre="mediaNombre"
        :inverted="direction === 'out'"
        forzar-documento
        @abrir="abrirMedia"
      />
    </div>

    <UCard
      v-if="textoVisible"
      :color="direction === 'out' ? 'primary' : 'neutral'"
      :variant="direction === 'out' ? 'solid' : 'subtle'"
      :ui="{ body: 'min-w-0 px-3 py-2 text-sm leading-relaxed' }"
      class="min-w-0 w-full max-w-[min(100%,320px)]"
      :class="[
        direction === 'out' ? 'rounded-br-sm' : 'rounded-bl-sm'
      ]"
    >
      <span class="block whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{{ msg.body }}</span>
    </UCard>
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

const captionEnBurbuja = computed(() => {
  const t = props.msg.body?.trim() || ''
  if (!t || t === mediaNombre.value) return ''
  return t
})

const videoCaption = computed(() =>
  props.msg.message_type === 'video' ? captionEnBurbuja.value : ''
)

const textoVisible = computed(() => {
  if (props.msg.message_type === 'video' && mediaUrl.value) return false
  if (showDocumentBubble.value && captionEnBurbuja.value) return false
  const t = props.msg.body?.trim() || ''
  if (!t) return false
  if (mediaUrl.value && t === mediaNombre.value) return false
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

function abrirMedia(url?: string, nombre?: string) {
  const u = url || mediaUrl.value
  if (!u) return
  const n = nombre || mediaNombre.value
  const ext = extensionAdjunto(n)
  const esImg = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
  const esVideo = props.msg.message_type === 'video' || ['mp4', 'webm', 'mov', 'm4v'].includes(ext)
  const fileItem: FileItem = {
    id: 0,
    file_name: n,
    file_url: u,
    type: esImg ? 'image' : esVideo ? 'video' : 'file',
    size: 0,
    lastModified: 0,
    file_ext: ext
  }
  modalPreview.open({ file: fileItem, isOpen: true })
}
</script>
