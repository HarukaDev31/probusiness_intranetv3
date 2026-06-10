<template>
  <div class="space-y-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
    <UAlert
      v-if="!canSend"
      color="error"
      variant="subtle"
      title="Ventana cerrada"
      description="Solo puedes enviar plantillas mientras la ventana esté cerrada."
    />

    <UCard
      v-if="replyTarget"
      color="neutral"
      variant="soft"
      :ui="{ body: 'flex items-start gap-2 p-2.5 sm:p-2.5' }"
    >
      <div class="min-w-0 flex-1">
        <p class="mb-1 text-[10px] font-medium text-muted">Respondiendo</p>
        <SoporteTiChatReplyPreview
          :remitente="replyTarget.label"
          :texto="replyTarget.text"
          :imagen-url="replyTarget.imageUrl"
        />
      </div>
      <UButton
        type="button"
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-heroicons-x-mark"
        class="shrink-0"
        @click="cancelarRespuesta"
      />
    </UCard>

    <UCard
      v-if="adjuntoPendiente"
      variant="subtle"
      :ui="{ body: 'flex items-center gap-2 p-2' }"
    >
      <UIcon :name="iconoAdjunto" class="size-6 shrink-0 text-primary" />
      <span class="min-w-0 flex-1 truncate text-xs">{{ adjuntoPendiente.name }}</span>
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-heroicons-x-mark"
        @click="quitarAdjunto"
      />
    </UCard>

    <div class="flex items-end gap-2">
      <input
        ref="fileMediaRef"
        type="file"
        class="hidden"
        :accept="WA_INBOX_CHAT_ACCEPT_MEDIA"
        @change="onPickMedia"
      >
      <input
        ref="fileDocRef"
        type="file"
        class="hidden"
        :accept="WA_INBOX_CHAT_ACCEPT_DOCUMENTOS"
        @change="onPickDocumento"
      >
      <input
        ref="fileAudioRef"
        type="file"
        class="hidden"
        :accept="WA_INBOX_CHAT_ACCEPT_AUDIO"
        @change="onPickAudio"
      >

      <UPopover v-if="canSend" v-model:open="menuAdjuntosAbierto" :content="{ side: 'top', align: 'start' }">
        <UButton
          type="button"
          color="neutral"
          variant="soft"
          size="md"
          icon="i-heroicons-plus"
          class="shrink-0"
          title="Adjuntar"
        />
        <template #content>
          <div class="flex min-w-[11rem] flex-col gap-0.5 p-1">
            <UButton
              type="button"
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-heroicons-photo"
              label="Fotos y videos"
              class="justify-start"
              @click="abrirMedia"
            />
            <UButton
              type="button"
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-heroicons-document"
              label="Documento"
              class="justify-start"
              @click="abrirDocumento"
            />
            <UButton
              type="button"
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-heroicons-musical-note"
              label="Audio"
              class="justify-start"
              @click="abrirAudio"
            />
          </div>
        </template>
      </UPopover>

      <div class="relative min-w-0 flex-1">
        <UCard
          class="min-w-0"
          color="neutral"
          variant="soft"
          :ui="{ body: 'flex items-end gap-1 p-1.5 pe-10 sm:p-1.5 sm:pe-10' }"
        >
          <UTextarea
            v-model="texto"
            :rows="1"
            autoresize
            :maxrows="5"
            variant="none"
            class="w-full text-[13px]"
            :disabled="!canSend"
            :placeholder="canSend ? 'Escribe un mensaje…' : 'Ventana cerrada — usa Plantillas arriba'"
            @keydown="onKeydown"
          />
        </UCard>
        <SoporteTiChatEmojiPicker
          class="absolute bottom-1.5 right-1.5"
          @pick="insertarEmoji"
        />
      </div>

      <UButton
        v-if="showSchedule"
        type="button"
        color="neutral"
        variant="soft"
        size="md"
        icon="i-heroicons-clock"
        class="shrink-0"
        :disabled="!canSend || sending"
        title="Programar mensaje"
        aria-label="Programar mensaje"
        @click="emit('schedule')"
      />

      <UButton
        color="primary"
        size="md"
        icon="i-heroicons-paper-airplane"
        class="shrink-0"
        :disabled="!puedeEnviar"
        :loading="sending"
        aria-label="Enviar"
        @click="enviar"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { WaInboxComposerReplyTarget, WaInboxComposerSendPayload } from '~/types/whatsapp-inbox'
import SoporteTiChatReplyPreview from '~/components/soporte-ti/SoporteTiChatReplyPreview.vue'
import SoporteTiChatEmojiPicker from '~/components/soporte-ti/SoporteTiChatEmojiPicker.vue'
import {
  WA_INBOX_CHAT_ACCEPT_AUDIO,
  WA_INBOX_CHAT_ACCEPT_DOCUMENTOS,
  WA_INBOX_CHAT_ACCEPT_MEDIA
} from '~/constants/whatsappInboxChat'
import { guessWaInboxMediaKind } from '~/utils/whatsappInboxMedia'

const props = withDefaults(
  defineProps<{
    canSend?: boolean
    sending?: boolean
    replyTarget?: WaInboxComposerReplyTarget | null
    modelValue?: string
    showSchedule?: boolean
  }>(),
  {
    canSend: true,
    sending: false,
    replyTarget: null,
    modelValue: undefined,
    showSchedule: false
  }
)

const emit = defineEmits<{
  send: [payload: WaInboxComposerSendPayload]
  schedule: []
  'cancel-reply': []
  'update:modelValue': [value: string]
}>()

const internalText = ref('')
const texto = computed({
  get() {
    return props.modelValue !== undefined ? props.modelValue : internalText.value
  },
  set(value: string) {
    if (props.modelValue !== undefined) {
      emit('update:modelValue', value)
    } else {
      internalText.value = value
    }
  }
})
const menuAdjuntosAbierto = ref(false)
const adjuntoPendiente = ref<File | null>(null)
const mediaKindPendiente = ref<'image' | 'video' | 'document' | 'audio' | null>(null)

const fileMediaRef = ref<HTMLInputElement | null>(null)
const fileDocRef = ref<HTMLInputElement | null>(null)
const fileAudioRef = ref<HTMLInputElement | null>(null)

const puedeEnviar = computed(() => {
  if (!props.canSend || props.sending) return false
  return Boolean(texto.value.trim() || adjuntoPendiente.value)
})

const iconoAdjunto = computed(() => {
  const k = mediaKindPendiente.value
  if (k === 'image') return 'i-heroicons-photo'
  if (k === 'video') return 'i-heroicons-film'
  if (k === 'audio') return 'i-heroicons-musical-note'
  return 'i-heroicons-document'
})

function insertarEmoji(emoji: string) {
  texto.value += emoji
}

function cancelarRespuesta() {
  emit('cancel-reply')
}

function abrirMedia() {
  menuAdjuntosAbierto.value = false
  fileMediaRef.value?.click()
}

function abrirDocumento() {
  menuAdjuntosAbierto.value = false
  fileDocRef.value?.click()
}

function abrirAudio() {
  menuAdjuntosAbierto.value = false
  fileAudioRef.value?.click()
}

function asignarArchivo(file: File) {
  adjuntoPendiente.value = file
  mediaKindPendiente.value = guessWaInboxMediaKind(file)
}

function onPickMedia(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) asignarArchivo(file)
  input.value = ''
}

function onPickDocumento(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) asignarArchivo(file)
  input.value = ''
}

function onPickAudio(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) asignarArchivo(file)
  input.value = ''
}

function quitarAdjunto() {
  adjuntoPendiente.value = null
  mediaKindPendiente.value = null
}

function enviar() {
  if (!puedeEnviar.value) return
  emit('send', {
    text: texto.value.trim(),
    file: adjuntoPendiente.value ?? undefined,
    mediaKind: mediaKindPendiente.value ?? undefined,
    replyToMetaMessageId: props.replyTarget?.metaMessageId ?? null
  })
  texto.value = ''
  quitarAdjunto()
  emit('cancel-reply')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    enviar()
  }
}
</script>
