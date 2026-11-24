<template>
  <div class="mb-5 grid gap-4 sm:grid-cols-2" :class="cards.length === 3 ? 'xl:grid-cols-3' : 'xl:grid-cols-4'">
    <div v-for="card in cards" :key="card.label" class="flex flex-col gap-0.5 rounded-2xl bg-default px-5 py-5 shadow-[0_6px_20px_rgba(30,42,59,.06)]">
      <span class="text-xs uppercase tracking-[0.08em] text-muted">{{ card.label }}</span>
      <span class="text-[28px] font-bold leading-tight" :class="card.tone">{{ card.value }}</span>
      <span v-if="card.sub" class="text-sm text-muted">{{ card.sub }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ cards: Array<{ label: string; value: string; tone: string; sub?: string }> }>()
</script>
