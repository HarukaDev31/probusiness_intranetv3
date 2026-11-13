<template>
  <label
    class="flex cursor-pointer items-center gap-3 rounded-lg border-[1.5px] border-dashed bg-default px-3.5 py-3 text-sm text-toned hover:border-primary"
    :class="fileName ? 'border-primary' : 'border-default'"
  >
    <UIcon name="i-heroicons-arrow-up-tray" class="size-5 shrink-0 text-primary" />
    <span class="min-w-0 flex-1 truncate">{{ fileName || label }}</span>
    <input type="file" :accept="accept" class="hidden" @change="onChange">
  </label>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  label: string
  accept: string
  currentName?: string | null
}>()

const emit = defineEmits<{ pick: [file: File | null] }>()

const fileName = ref(props.currentName || '')

watch(() => props.currentName, (value) => {
  fileName.value = value || ''
})

function onChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] || null
  fileName.value = file?.name || props.currentName || ''
  emit('pick', file)
}
</script>
