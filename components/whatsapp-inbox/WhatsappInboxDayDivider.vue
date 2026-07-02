<template>
  <div
    class="flex justify-center py-2"
    data-wa-day-divider
    :data-wa-day-label="label"
  >
    <span
      class="rounded-md bg-neutral-800/85 px-2.5 py-0.5 text-xs font-semibold text-neutral-100 shadow-sm dark:bg-neutral-700/90"
    >
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
}>()
</script>
