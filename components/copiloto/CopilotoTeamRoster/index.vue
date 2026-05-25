<template>
  <aside class="flex w-44 shrink-0 flex-col border-r border-default bg-white dark:bg-gray-900">
    <p class="shrink-0 border-b border-default px-3 py-2 text-xs font-bold text-highlighted">Equipo</p>
    <div class="min-h-0 flex-1 overflow-y-auto p-2 space-y-1">
      <button
        v-for="member in members"
        :key="member.id"
        type="button"
        class="w-full rounded-lg border px-2 py-2 text-left text-xs transition"
        :class="selectedId === member.id
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
          : 'border-transparent hover:bg-elevated/50'"
        @click="emit('select', member.id)"
      >
        <div class="flex items-center gap-2">
          <UAvatar :text="member.initials" size="xs" />
          <span class="truncate font-semibold">{{ member.name }}</span>
        </div>
        <p class="mt-1 text-[10px] text-muted">{{ member.leadsActivos }} leads · {{ member.alertas }} alertas</p>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { CopilotoTeamMember } from '~/types/copiloto/lead'

defineProps<{
  members: CopilotoTeamMember[]
  selectedId: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()
</script>
