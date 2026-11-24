<template>
  <UModal :open="open" :title="title" :description="subtitle" :ui="{ content: `${width} bg-transparent ring-0 divide-y-0` }" @update:open="(value: boolean) => !value && emit('close')">
    <template #content>
      <div class="cc cc-modal">
        <div class="cc-modal-head"><span class="text-[20px] font-semibold leading-tight">{{ title }}</span><span v-if="subtitle" class="text-[13px] text-(--cc-muted)">{{ subtitle }}</span></div>
        <div class="cc-modal-body"><slot /></div>
        <div class="cc-modal-foot"><slot name="footer" /></div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ open: boolean; title: string; subtitle?: string; width?: string }>(), { subtitle: '', width: 'w-full max-w-[520px]' })
const emit = defineEmits<{ close: [] }>()
</script>
