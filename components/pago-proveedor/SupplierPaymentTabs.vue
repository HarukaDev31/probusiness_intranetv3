<template>
  <div class="flex gap-1.5 border-b border-default">
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      class="-mb-px flex items-center gap-2 border-b-2 px-3.5 py-2 text-sm font-semibold"
      :class="item.value === modelValue ? 'border-orange-500 text-orange-600' : 'border-transparent text-muted'"
      @click="emit('update:modelValue', item.value)"
    >
      {{ item.label }}
      <span v-if="item.count" class="rounded-full bg-orange-500 px-1.5 text-[11px] font-bold text-white">{{ item.count }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  items: Array<{ label: string; value: string; count?: number }>
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
