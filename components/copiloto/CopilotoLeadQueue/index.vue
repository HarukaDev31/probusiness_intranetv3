<template>
  <aside class="flex h-full min-h-0 max-h-full flex-col overflow-hidden border-r border-default bg-white dark:bg-gray-900">
    <div class="flex shrink-0 flex-col gap-2 border-b border-default px-3 py-2.5">
      <div class="flex items-center justify-between gap-2">
        <span class="text-sm font-bold text-highlighted">
          {{ title }}
          <UBadge color="primary" variant="solid" size="xs" class="ms-1">{{ leads.length }}</UBadge>
        </span>
        <div class="flex items-center gap-0.5">
          <UButton
            v-if="!readonly"
            icon="i-heroicons-user-plus"
            color="primary"
            variant="soft"
            size="xs"
            aria-label="Nuevo contacto"
            title="Nuevo contacto"
            @click="emit('new-contact')"
          />
          <UButton
            v-if="!readonly"
            icon="i-heroicons-arrow-path"
            color="neutral"
            variant="ghost"
            size="xs"
            :loading="loading"
            aria-label="Sincronizar directorio"
            title="Sincronizar directorio de contactos"
            @click="emit('sync')"
          />
        </div>
      </div>
      <UInput
        :model-value="search"
        icon="i-heroicons-magnifying-glass"
        placeholder="Buscar nombre o teléfono…"
        size="sm"
        class="w-full"
        :loading="loading"
        @update:model-value="emit('update:search', $event)"
      />
    </div>
    <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5">
      <p v-if="loading && !leads.length" class="px-1 py-6 text-center text-xs text-muted">
        Buscando…
      </p>
      <p v-else-if="!leads.length" class="px-1 py-6 text-center text-xs text-muted">
        {{ search.trim() ? 'Sin resultados' : 'Sin contactos en la cola' }}
      </p>
      <button
        v-for="(lead, index) in leads"
        :key="lead.id"
        type="button"
        class="mb-1.5 w-full rounded-lg border px-3 py-2.5 text-left transition"
        :class="index === selectedIndex
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40'
          : 'border-transparent hover:border-default hover:bg-elevated/60'"
        @click="emit('select', index)"
      >
        <div class="flex min-w-0 items-center gap-2">
          <span class="size-2 shrink-0 rounded-full" :style="{ background: lead.dot }" />
          <span class="min-w-0 flex-1 truncate text-sm font-semibold text-highlighted">{{ lead.name }}</span>
          <UBadge
            v-if="rowUnread(index)"
            color="primary"
            variant="solid"
            size="xs"
            class="shrink-0"
          >
            {{ rowUnread(index) }}
          </UBadge>
          <span v-if="rowTime(index)" class="shrink-0 text-[10px] text-muted">{{ rowTime(index) }}</span>
        </div>
        <div class="mt-1 min-w-0">
          <WhatsappInboxSidebarPreview
            v-if="rowConversation(index)"
            :conversation="rowConversation(index)!"
          />
          <p v-else class="truncate text-xs text-muted">{{ lead.prev }}</p>
        </div>
        <div class="mt-1.5 flex items-center justify-between gap-1">
          <UBadge
            :style="{ background: tempCfg(lead.temp).bg, color: tempCfg(lead.temp).color }"
            variant="subtle"
            size="xs"
          >
            <UIcon :name="tempCfg(lead.temp).icon" class="size-3" />
            {{ lead.tLbl }}
          </UBadge>
          <span class="text-xs font-bold tabular-nums" :style="{ color: tempCfg(lead.temp).bar }">
            {{ lead.tLbl === 'Sin IA' ? '—' : lead.temp }}
          </span>
        </div>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { CopilotoLead } from '~/types/copiloto/lead'
import type { WaCopilotoConversation } from '~/types/wa-copiloto'
import { getCopilotoTempConfig } from '~/constants/copiloto/temperature'
import WhatsappInboxSidebarPreview from '~/components/whatsapp-inbox/WhatsappInboxSidebarPreview.vue'

const props = withDefaults(
  defineProps<{
    title?: string
    leads: CopilotoLead[]
    conversations?: WaCopilotoConversation[]
    selectedIndex: number
    search?: string
    loading?: boolean
    readonly?: boolean
  }>(),
  {
    title: 'Mi cola',
    conversations: () => [],
    search: '',
    loading: false,
    readonly: false
  }
)

const emit = defineEmits<{
  select: [index: number]
  'update:search': [value: string]
  'new-contact': []
  sync: []
}>()

const tempCfg = getCopilotoTempConfig

function rowConversation(index: number): WaCopilotoConversation | null {
  const conv = props.conversations[index]
  if (!conv || conv.pending_contact) return null
  return conv
}

function rowTime(index: number): string {
  const conv = props.conversations[index]
  if (conv?.last_message_time_label) return conv.last_message_time_label
  return props.leads[index]?.prevTime || ''
}

function rowUnread(index: number): number {
  const n = Number(props.conversations[index]?.unread_count ?? 0)
  return Number.isFinite(n) && n > 0 ? n : 0
}
</script>
