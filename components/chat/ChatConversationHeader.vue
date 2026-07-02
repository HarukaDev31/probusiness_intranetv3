<template>
  <div class="flex items-center justify-between gap-2 border-b border-default px-3 py-2.5 sm:px-4">
    <div class="flex min-w-0 items-center gap-2">
      <UAvatar :text="avatarText" size="sm" class="shrink-0" />
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold text-highlighted">{{ title }}</p>
        <p v-if="subtitle" class="truncate text-xs text-muted">{{ subtitle }}</p>
      </div>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 items-center gap-1">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  avatarText: string
  title: string
  subtitle?: string
}>()
</script>
