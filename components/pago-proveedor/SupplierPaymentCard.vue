<template>
  <section class="flex h-full flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-4">
    <h4 class="text-[15px] font-bold text-gray-900">{{ title }}</h4>
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>
