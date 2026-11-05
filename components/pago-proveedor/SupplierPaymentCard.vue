<template>
  <UCard class="flex h-full flex-col gap-2" :ui="{ body: 'flex h-full flex-col gap-2' }">
    <h4 class="text-[15px] font-bold">{{ title }}</h4>
    <slot />
  </UCard>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>
