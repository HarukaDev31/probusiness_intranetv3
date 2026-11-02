<template>
  <div class="flex items-start justify-between gap-3 border-b border-gray-100 py-1.5 last:border-0">
    <span class="text-xs text-gray-500">{{ label }}</span>
    <span class="text-right text-sm font-bold" :class="valueClass || 'text-gray-900'"><slot>{{ value }}</slot></span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value?: string | number | null
  valueClass?: string
}>()
</script>
