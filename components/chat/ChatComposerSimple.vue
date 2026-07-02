<template>
  <div class="flex items-end gap-2 border-t border-default p-3" :class="rootClass">
    <UInput
      v-model="model"
      :placeholder="placeholder"
      :disabled="disabled"
      class="flex-1"
      @keydown.enter.prevent="onEnter"
    />
    <UButton
      color="primary"
      size="md"
      icon="i-heroicons-paper-airplane"
      :disabled="disabled || !model.trim()"
      aria-label="Enviar"
      @click="emitSend"
    />
  </div>
</template>

<script setup lang="ts">
const model = defineModel<string>({ default: '' })

withDefaults(
  defineProps<{
    placeholder?: string
    disabled?: boolean
    rootClass?: string
  }>(),
  {
    placeholder: 'Escribe un mensaje…',
    disabled: false,
    rootClass: ''
  }
)

const emit = defineEmits<{
  send: []
}>()

function emitSend() {
  if (!model.value.trim()) return
  emit('send')
}

function onEnter() {
  emitSend()
}
</script>
