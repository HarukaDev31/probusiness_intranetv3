<template>
  <div class="flex min-h-0 flex-1 gap-2 overflow-hidden p-2" aria-hidden="true">
    <div
      v-for="n in columns"
      :key="n"
      class="flex w-[220px] shrink-0 flex-col rounded-lg border border-default bg-elevated/30"
    >
      <div class="flex items-center justify-between gap-2 rounded-t-lg bg-gray-300 px-3 py-2.5 dark:bg-gray-700">
        <USkeleton class="h-3.5 w-24" />
        <USkeleton class="h-4 w-6 rounded-full" />
      </div>
      <div class="space-y-2 p-2">
        <div
          v-for="c in cardsPerColumn"
          :key="c"
          class="rounded-lg border border-default bg-white p-2.5 dark:bg-gray-900"
        >
          <USkeleton class="h-4 w-3/4" />
          <USkeleton class="mt-2 h-2.5 w-1/2" />
          <USkeleton class="mt-2 h-8 w-full rounded-md" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    columns?: number
    cardsPerColumn?: number
  }>(),
  {
    columns: 6,
    cardsPerColumn: 2
  }
)
</script>
