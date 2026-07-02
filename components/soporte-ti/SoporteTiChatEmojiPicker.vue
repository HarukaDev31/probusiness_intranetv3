<template>
  <UPopover :content="{ side: 'top', align: 'end' }">
    <UButton
      type="button"
      color="neutral"
      variant="ghost"
      size="sm"
      icon="i-heroicons-face-smile"
      :class="botonClase"
      title="Emoji"
    />
    <template #content>
      <div class="max-h-52 w-72 overflow-y-auto p-2">
        <div class="grid grid-cols-8 gap-0.5">
          <button
            v-for="e in SOPORTE_TI_CHAT_EMOJIS"
            :key="e"
            type="button"
            class="flex size-9 items-center justify-center rounded-lg text-xl transition hover:bg-elevated"
            @click="elegir(e)"
          >
            {{ e }}
          </button>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SOPORTE_TI_CHAT_EMOJIS } from '~/constants/soporteTiChat'

const props = withDefaults(
  defineProps<{
    oscuro?: boolean
  }>(),
  { oscuro: false }
)

const emit = defineEmits<{
  pick: [emoji: string]
}>()

const botonClase = computed(() =>
  props.oscuro ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-muted'
)

function elegir(emoji: string) {
  emit('pick', emoji)
}
</script>
