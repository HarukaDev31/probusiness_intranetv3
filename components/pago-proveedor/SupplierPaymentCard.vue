<template>
  <UCard class="flex h-full flex-col gap-2" :ui="{ body: 'flex h-full flex-col gap-2' }">
    <div class="mb-1 flex items-center gap-3">
      <span v-if="icon" class="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-600"><UIcon :name="icon" class="size-5" /></span>
      <h4 class="text-[15px] font-bold">{{ title }}</h4>
      <slot name="title-extra" />
    </div>
    <slot />
  </UCard>
</template>

<script setup lang="ts">
defineProps<{ title: string; icon?: string }>()
</script>
