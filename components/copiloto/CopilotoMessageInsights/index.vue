<template>
  <div v-if="insights.length" class="mt-1.5 flex w-full max-w-[min(100%,22rem)] flex-col gap-1">
    <div
      v-for="item in insights"
      :key="item.id"
      class="rounded-lg border px-2.5 py-1.5 text-[11px] leading-snug"
      :class="kindClass(item.kind)"
    >
      <p class="flex items-center gap-1 font-semibold">
        <UIcon :name="kindIcon(item.kind)" class="size-3.5 shrink-0" />
        <span>{{ item.label || kindLabel(item.kind) }}</span>
        <UBadge
          v-if="item.kind === 'temperatura' && item.score != null"
          size="xs"
          variant="subtle"
          class="ms-auto"
        >
          {{ item.score }}
        </UBadge>
      </p>
      <p class="mt-0.5 text-muted">{{ item.body }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WaCopilotoMessageInsight } from '~/types/wa-copiloto'

defineProps<{
  insights: WaCopilotoMessageInsight[]
}>()

function kindLabel(kind: WaCopilotoMessageInsight['kind']) {
  if (kind === 'temperatura') return 'Temperatura'
  if (kind === 'sugerencia') return 'Sugerencia'
  return 'Comentario'
}

function kindIcon(kind: WaCopilotoMessageInsight['kind']) {
  if (kind === 'temperatura') return 'i-heroicons-fire'
  if (kind === 'sugerencia') return 'i-heroicons-light-bulb'
  return 'i-heroicons-chat-bubble-left-ellipsis'
}

function kindClass(kind: WaCopilotoMessageInsight['kind']) {
  if (kind === 'temperatura') return 'border-amber-200 bg-amber-50/90 dark:border-amber-900 dark:bg-amber-950/30'
  if (kind === 'sugerencia') return 'border-primary-200 bg-primary-50/80 dark:border-primary-900 dark:bg-primary-950/30'
  return 'border-default bg-elevated/50'
}
</script>
