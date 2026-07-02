<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3 px-3 py-4 sm:px-4" aria-hidden="true">
    <div v-for="n in filas" :key="n" class="flex gap-2.5" :class="n % 2 === 0 ? '' : 'flex-row-reverse'">
      <USkeleton class="size-8 shrink-0 rounded-full" />
      <div class="max-w-[min(20rem,75%)] space-y-1.5" :class="n % 2 === 0 ? '' : 'ml-auto'">
        <USkeleton class="h-3 w-20" />
        <USkeleton class="h-14 w-48 rounded-2xl" />
        <USkeleton class="h-2.5 w-12" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ filas?: number }>(), { filas: 5 })
</script>
