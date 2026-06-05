<template>
  <div v-if="visibleInsights.length" class="mt-1.5 flex w-full max-w-[min(100%,22rem)] flex-col gap-1">
    <component
      :is="selectable && item.kind === 'sugerencia' ? 'button' : 'div'"
      v-for="item in visibleInsights"
      :key="item.id"
      :type="selectable && item.kind === 'sugerencia' ? 'button' : undefined"
      class="rounded-lg border px-2.5 py-1.5 text-left text-[11px] leading-snug"
      :class="[
        kindClass(item.kind),
        selectable && item.kind === 'sugerencia'
          ? 'cursor-pointer transition hover:ring-2 hover:ring-primary-400/60'
          : ''
      ]"
      @click="selectable && item.kind === 'sugerencia' ? emit('select', item) : undefined"
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
        <UIcon
          v-if="selectable && item.kind === 'sugerencia'"
          name="i-heroicons-arrow-up-left"
          class="ms-auto size-3.5 text-primary"
        />
      </p>
      <p class="mt-0.5 text-muted">{{ item.body }}</p>
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WaCopilotoMessageInsight } from '~/types/wa-copiloto'

const props = withDefaults(
  defineProps<{
    insights: WaCopilotoMessageInsight[]
    selectable?: boolean
    /** Las sugerencias accionables van en el banner superior; aquí solo análisis. */
    hideSuggestions?: boolean
  }>(),
  {
    selectable: false,
    hideSuggestions: false
  }
)

const visibleInsights = computed(() =>
  props.hideSuggestions
    ? props.insights.filter((item) => item.kind !== 'sugerencia')
    : props.insights
)

const emit = defineEmits<{
  select: [insight: WaCopilotoMessageInsight]
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
