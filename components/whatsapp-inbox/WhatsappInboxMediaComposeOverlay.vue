<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[120] flex flex-col bg-neutral-950 text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Vista previa de imagen"
    >
      <div class="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2.5">
        <UButton
          type="button"
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-heroicons-x-mark"
          class="text-white/80"
          title="Cancelar"
          @click="emit('cancel')"
        />
        <p class="min-w-0 flex-1 truncate text-sm font-medium">
          {{ titulo }}
        </p>
      </div>

      <div class="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3">
        <img
          v-if="previewActual && mediaKindActual === 'image'"
          :src="previewActual"
          :alt="nombreActual"
          class="max-h-full max-w-full object-contain"
        >
        <video
          v-else-if="previewActual && mediaKindActual === 'video'"
          :src="previewActual"
          class="max-h-full max-w-full object-contain"
          controls
          playsinline
        />
      </div>

      <div class="shrink-0 border-t border-white/10 bg-neutral-950 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3">
        <div class="flex items-end gap-2">
          <div class="relative min-w-0 flex-1">
            <UCard
              class="min-w-0"
              :ui="{ root: 'bg-neutral-800 ring-white/10', body: 'flex items-end gap-1 p-1.5 pe-10 sm:p-1.5 sm:pe-10' }"
            >
              <UTextarea
                :model-value="caption"
                :rows="1"
                autoresize
                :maxrows="4"
                variant="none"
                class="w-full text-[13px] text-white placeholder:text-white/40"
                placeholder="Escribe un mensaje"
                @update:model-value="emit('update:caption', $event)"
                @keydown="onKeydown"
              />
            </UCard>
            <SoporteTiChatEmojiPicker
              class="absolute bottom-1.5 right-1.5"
              oscuro
              @pick="emit('append-emoji', $event)"
            />
          </div>

          <UButton
            color="primary"
            size="md"
            icon="i-heroicons-paper-airplane"
            class="shrink-0"
            :disabled="!puedeEnviar"
            :loading="sending"
            aria-label="Enviar"
            @click="emit('send')"
          />
        </div>

        <div class="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            v-for="(item, index) in items"
            :key="`${item.preview}-${index}`"
            type="button"
            class="relative shrink-0 rounded-lg ring-2 ring-transparent transition"
            :class="index === activeIndex ? 'ring-primary' : 'opacity-70 hover:opacity-100'"
            @click="emit('update:activeIndex', index)"
          >
            <UCard class="size-14 overflow-hidden p-0" :ui="{ body: 'p-0 sm:p-0' }">
              <img
                v-if="item.mediaKind === 'image'"
                :src="item.preview"
                :alt="item.file.name"
                class="size-full object-cover"
              >
              <div
                v-else
                class="flex size-full items-center justify-center bg-neutral-800 text-white/80"
              >
                <UIcon name="i-heroicons-film" class="size-6" />
              </div>
            </UCard>
            <button
              type="button"
              class="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-neutral-900 text-white shadow"
              title="Quitar"
              @click.stop="emit('remove', index)"
            >
              <UIcon name="i-heroicons-x-mark" class="size-3" />
            </button>
          </button>

          <UButton
            v-if="canAddMore"
            type="button"
            color="neutral"
            variant="soft"
            size="md"
            icon="i-heroicons-plus"
            class="size-14 shrink-0"
            title="Añadir imagen o video"
            @click="emit('add-more')"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SoporteTiChatEmojiPicker from '~/components/soporte-ti/SoporteTiChatEmojiPicker.vue'
import type { WaInboxMediaKind } from '~/utils/whatsappInboxMedia'

export type WaInboxComposeMediaItem = {
  file: File
  preview: string
  mediaKind: WaInboxMediaKind
}

const props = withDefaults(
  defineProps<{
    open: boolean
    items: WaInboxComposeMediaItem[]
    activeIndex: number
    caption: string
    sending?: boolean
    canAddMore?: boolean
  }>(),
  {
    sending: false,
    canAddMore: true
  }
)

const emit = defineEmits<{
  cancel: []
  send: []
  'add-more': []
  remove: [index: number]
  'update:activeIndex': [index: number]
  'update:caption': [value: string]
  'append-emoji': [emoji: string]
}>()

const itemActual = computed(() => props.items[props.activeIndex] ?? null)
const previewActual = computed(() => itemActual.value?.preview ?? '')
const nombreActual = computed(() => itemActual.value?.file.name ?? 'archivo')
const mediaKindActual = computed(() => itemActual.value?.mediaKind ?? 'image')

const titulo = computed(() => {
  const n = props.items.length
  if (n <= 1) return '1 archivo'
  return `${n} archivos`
})

const puedeEnviar = computed(() => props.items.length > 0 && !props.sending)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (puedeEnviar.value) emit('send')
  }
}
</script>
