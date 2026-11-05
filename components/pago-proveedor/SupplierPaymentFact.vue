<template>
  <div class="flex items-start justify-between gap-3 border-b border-default py-1.5 last:border-0">
    <span class="text-xs text-muted">{{ label }}</span>
    <span class="text-right text-sm font-bold" :class="valueClass || 'text-highlighted'"><slot>{{ value }}</slot></span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value?: string | number | null
  valueClass?: string
}>()
</script>
