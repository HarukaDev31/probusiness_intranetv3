<template>
  <section class="mb-5">
    <p class="mb-2 text-sm text-muted">Resumen · {{ rangeLabel }}</p>
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <div
        v-for="card in cards"
        :key="card.label"
        class="flex flex-col gap-0.5 rounded-2xl bg-default px-5 py-5 shadow-[0_6px_20px_rgba(30,42,59,.06)]"
      >
        <span class="text-xs uppercase tracking-[0.08em] text-muted">{{ card.label }}</span>
        <USkeleton v-if="loading && !loaded" class="mt-1 h-8 w-28" />
        <span v-else class="text-[28px] font-bold leading-tight" :class="card.tone">{{ card.value }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  cards: { label: string; value: string; tone: string }[]
  rangeLabel: string
  loading: boolean
}>()

// El esqueleto solo aparece en la primera carga; después los valores se actualizan sin parpadeo.
const loaded = ref(false)
watch(() => props.loading, (value) => { if (!value) loaded.value = true })
</script>
