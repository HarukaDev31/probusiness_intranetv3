<template>
  <aside class="flex min-h-0 flex-col border-r border-default bg-white dark:bg-gray-900">
    <div class="flex shrink-0 items-center justify-between border-b border-default px-3 py-2">
      <span class="text-xs font-bold text-highlighted">
        {{ title }}
        <UBadge color="primary" variant="solid" size="xs" class="ms-1">{{ leads.length }}</UBadge>
      </span>
      <UButton
        v-if="!readonly"
        icon="i-heroicons-arrows-up-down"
        color="neutral"
        variant="ghost"
        size="xs"
        aria-label="Ordenar"
      />
    </div>
    <div class="min-h-0 flex-1 overflow-y-auto p-2">
      <button
        v-for="(lead, index) in leads"
        :key="lead.id"
        type="button"
        class="mb-1 w-full rounded-lg border px-2.5 py-2 text-left transition"
        :class="index === selectedIndex
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40'
          : 'border-transparent hover:border-default hover:bg-elevated/60'"
        @click="emit('select', index)"
      >
        <div class="flex items-center gap-1.5">
          <span class="size-2 shrink-0 rounded-full" :style="{ background: lead.dot }" />
          <span class="truncate text-xs font-semibold text-highlighted">{{ lead.name }}</span>
        </div>
        <p class="mt-0.5 truncate text-[10px] text-muted">{{ lead.prev }}</p>
        <div class="mt-1 flex items-center justify-between gap-1">
          <UBadge
            :style="{ background: tempCfg(lead.temp).bg, color: tempCfg(lead.temp).color }"
            variant="subtle"
            size="xs"
          >
            <UIcon :name="tempCfg(lead.temp).icon" class="size-3" />
            {{ lead.tLbl }}
          </UBadge>
          <span class="text-[10px] font-bold tabular-nums" :style="{ color: tempCfg(lead.temp).bar }">
            {{ lead.score }}
          </span>
        </div>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { CopilotoLead } from '~/types/copiloto/lead'
import { getCopilotoTempConfig } from '~/constants/copiloto/temperature'

withDefaults(
  defineProps<{
    title?: string
    leads: CopilotoLead[]
    selectedIndex: number
    readonly?: boolean
  }>(),
  {
    title: 'Mi cola',
    readonly: false
  }
)

defineEmits<{
  select: [index: number]
}>()

const tempCfg = getCopilotoTempConfig
</script>
