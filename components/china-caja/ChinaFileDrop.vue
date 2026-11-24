<template>
  <label class="cc-drop" :class="file ? 'on' : ''">
    <UIcon v-if="icon" name="i-lucide-upload" class="size-5 flex-none text-(--cc-orange)" />
    <span class="cc-grow cc-cut">{{ file?.name || label }}</span>
    <span class="whitespace-nowrap text-xs" :class="hintTone">{{ hint }}</span>
    <input type="file" class="hidden" :accept="CHINA_FILE_ACCEPT" @change="onChange">
  </label>
</template>

<script setup lang="ts">
import { CHINA_FILE_ACCEPT } from '~/constants/chinaCaja'

withDefaults(defineProps<{ file: File | null; label: string; hint: string; hintTone?: string; icon?: boolean }>(), { hintTone: 'text-(--cc-orange-ink)', icon: false })
const emit = defineEmits<{ pick: [file: File | null] }>()

function onChange(event: Event) {
  emit('pick', (event.target as HTMLInputElement).files?.[0] || null)
}
</script>
