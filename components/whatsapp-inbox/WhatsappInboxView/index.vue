<template>
  <UCard
    class="flex h-[calc(100vh-4rem)] min-h-0 flex-col overflow-hidden"
    variant="outline"
    :ui="{ body: 'flex min-h-0 flex-1 flex-col p-0 sm:p-0', header: 'px-4 py-3 sm:px-4', footer: 'p-0' }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <span class="flex items-center gap-2 font-bold text-primary">
          <span
            class="size-2 rounded-full"
            :class="refreshing ? 'animate-pulse bg-warning' : 'bg-success'"
          />
          PROBUSINESS
        </span>
        <span class="text-sm text-muted">/ WhatsApp Inbox</span>
        <div class="flex-1" />
        <UCard
          v-if="session"
          variant="subtle"
          :ui="{ body: 'flex items-center gap-2 px-2.5 py-1.5 sm:py-1.5' }"
        >
          <span
            class="size-1.5 shrink-0 rounded-full"
            :class="refreshing ? 'animate-pulse bg-warning' : 'bg-success'"
          />
          <span class="text-xs text-muted">{{ session.display_number || session.label }}</span>
        </UCard>
        <UButton
          icon="i-heroicons-arrow-path"
          color="neutral"
          variant="ghost"
          size="xs"
          :loading="refreshing"
          aria-label="Actualizar"
          @click="refreshInbox"
        />
      </div>
    </template>

    <div class="flex min-h-0 flex-1">
      <!-- Sidebar -->
      <UCard
        class="flex w-72 shrink-0 flex-col rounded-none border-y-0 border-l-0 md:w-80"
        variant="outline"
        :ui="panelCardUi"
      >
        <div class="border-b border-default p-3">
          <div class="mb-2 flex items-center justify-between">
            <h2 class="text-sm font-bold text-highlighted">Conversaciones</h2>
            <UBadge v-if="unreadTotal" color="primary" size="xs">{{ unreadTotal }}</UBadge>
          </div>
          <UInput
            v-model="search"
            icon="i-heroicons-magnifying-glass"
            placeholder="Buscar cliente…"
            size="sm"
            class="w-full"
          />
        </div>
        <div class="flex gap-1 overflow-x-auto border-b border-default p-2">
          <UButton
            v-for="f in filterOptions"
            :key="f.value"
            size="xs"
            :variant="filter === f.value ? 'solid' : 'ghost'"
            :color="filter === f.value ? 'primary' : 'neutral'"
            :label="f.label"
            @click="filter = f.value"
          />
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto">
          <p v-if="loadingConversations" class="p-4 text-center text-xs text-muted">Cargando…</p>
          <p v-else-if="!conversations.length" class="p-4 text-center text-xs text-muted">Sin conversaciones</p>
          <button
            v-for="c in conversations"
            :key="c.id"
            type="button"
            class="flex w-full gap-2 border-b border-default px-3 py-2.5 text-left transition-colors"
            :class="convRowClass(c)"
            @click="selectConversation(c.id)"
          >
            <div class="relative shrink-0">
              <UAvatar
                :text="c.initials"
                size="md"
                :ui="{ root: 'ring-1 ring-default', fallback: 'text-primary font-bold' }"
              />
              <span
                class="absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-default"
                :class="windowDotClass(c.window_state)"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-highlighted">{{ c.contact_name }}</p>
              <p class="truncate text-xs text-muted">{{ c.last_message_preview || '—' }}</p>
            </div>
            <div class="flex shrink-0 flex-col items-end gap-1">
              <span class="text-[10px] text-muted">{{ c.last_message_time_label }}</span>
              <UBadge v-if="c.unread_count" color="primary" size="xs">{{ c.unread_count }}</UBadge>
            </div>
          </button>
        </div>
      </UCard>

      <!-- Chat -->
      <ChatPanelShell :full-height="false" class="min-h-0 min-w-0 flex-1 rounded-none border-0">
        <template v-if="selectedConversation" #header>
          <div class="flex items-center gap-3 border-b border-default px-4 py-3">
            <UAvatar
              :text="selectedConversation.initials"
              size="md"
              :ui="{ fallback: 'text-primary font-bold' }"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-highlighted">{{ selectedConversation.contact_name }}</p>
              <p class="truncate text-xs text-muted">
                {{ selectedConversation.phone_display }} · {{ selectedConversation.channel_label }}
              </p>
            </div>
            <UBadge
              :color="windowBadgeColor(selectedConversation.window_state)"
              variant="subtle"
              size="sm"
            >
              {{ selectedConversation.window_label }}
            </UBadge>
            <USelectMenu
              :model-value="selectedConversation.assigned_user_id ?? undefined"
              :items="assignSelectItems"
              value-key="value"
              placeholder="Asignar"
              size="sm"
              class="w-40"
              @update:model-value="onAssign"
            />
          </div>
        </template>

        <template v-if="selectedConversation">
          <ChatMessagesScroll class="min-h-0 flex-1 p-4">
            <p v-if="loadingMessages" class="py-8 text-center text-sm text-muted">Cargando mensajes…</p>
            <template v-else>
              <div
                v-for="msg in messages"
                :key="msg.id"
                class="mb-2 flex flex-col"
                :class="msg.direction === 'out' ? 'items-end' : 'items-start'"
              >
                <p
                  v-if="msg.is_template && msg.template_name"
                  class="mb-1 text-[10px] font-semibold uppercase text-info"
                >
                  {{ msg.template_name }}
                </p>
                <UCard
                  :color="msg.direction === 'out' ? 'primary' : 'neutral'"
                  :variant="msg.direction === 'out' ? 'solid' : 'subtle'"
                  :ui="{ body: 'px-3 py-2 text-sm leading-relaxed max-w-[75%]' }"
                  :class="msg.direction === 'out' ? 'rounded-br-sm' : 'rounded-bl-sm'"
                >
                  <span class="whitespace-pre-wrap">{{ msg.body }}</span>
                </UCard>
                <span class="mt-0.5 flex items-center gap-1 text-[10px] text-muted">
                  {{ msg.time_label }}
                  <span v-if="msg.direction === 'out'">{{ deliveryIcon(msg.delivery_status) }}</span>
                </span>
              </div>
            </template>
          </ChatMessagesScroll>
        </template>

        <div v-else class="flex flex-1 items-center justify-center text-sm text-muted">
          Selecciona una conversación
        </div>

        <template v-if="selectedConversation" #footer>
          <div class="flex flex-col">
            <WhatsappInboxTemplatesStrip
              :templates="templates"
              :loading="loadingTemplates"
              :window-open="windowIsOpen"
              @open-modal="openTemplateModal()"
              @select="openTemplateModal"
            />
            <div class="space-y-2 p-3">
            <div
              v-if="!selectedConversation.can_send_text"
              class="flex flex-wrap items-center justify-between gap-2"
            >
              <UAlert
                class="min-w-0 flex-1"
                color="error"
                variant="subtle"
                title="Ventana cerrada"
                description="El texto libre no está disponible. Usa una plantilla para reactivar la conversación."
              />
              <UButton size="xs" color="primary" label="Elegir plantilla" @click="openTemplateModal()" />
            </div>
            <div class="flex items-end gap-2">
              <UTextarea
                v-model="draftMessage"
                :disabled="!selectedConversation.can_send_text"
                :placeholder="selectedConversation.can_send_text
                  ? 'Escribe un mensaje…'
                  : 'Ventana cerrada — elige una plantilla arriba'"
                :rows="1"
                autoresize
                class="flex-1"
                @keydown.enter.exact.prevent="sendTextMessage"
              />
              <UButton
                icon="i-heroicons-document-text"
                color="neutral"
                variant="outline"
                aria-label="Plantillas"
                @click="openTemplateModal()"
              />
              <UButton
                icon="i-heroicons-paper-airplane"
                color="primary"
                :disabled="!selectedConversation.can_send_text || !draftMessage.trim()"
                aria-label="Enviar"
                @click="sendTextMessage"
              />
            </div>
            </div>
          </div>
        </template>
      </ChatPanelShell>
    </div>

    <WhatsappInboxTemplateModal
      v-model:open="templateModalOpen"
      :templates="templates"
      :preselect="templatePreselect"
      @send="sendTemplateMessage"
    />
  </UCard>
</template>

<script setup lang="ts">
import type {
  WaInboxConversation,
  WaInboxFilter,
  WaInboxTemplate,
  WaInboxWindowState
} from '~/types/whatsapp-inbox'
import ChatMessagesScroll from '~/components/chat/ChatMessagesScroll.vue'
import ChatPanelShell from '~/components/chat/ChatPanelShell.vue'
import WhatsappInboxTemplateModal from '~/components/whatsapp-inbox/WhatsappInboxTemplateModal.vue'
import WhatsappInboxTemplatesStrip from '~/components/whatsapp-inbox/WhatsappInboxTemplatesStrip.vue'

const panelCardUi = {
  body: 'flex min-h-0 flex-1 flex-col p-0 sm:p-0',
  header: 'p-0 sm:p-0',
  footer: 'p-0 sm:p-0'
}

const {
  session,
  conversations,
  messages,
  templates,
  assignableUsers,
  selectedConversationId,
  selectedConversation,
  search,
  filter,
  draftMessage,
  loadingConversations,
  loadingMessages,
  loadingTemplates,
  refreshing,
  unreadTotal,
  init,
  refreshInbox,
  selectConversation,
  sendTextMessage,
  sendTemplateMessage,
  assignConversation,
  disconnectWebSocket
} = useWhatsappInbox()

const templateModalOpen = ref(false)
const templatePreselect = ref<WaInboxTemplate | null>(null)

const windowIsOpen = computed(() => {
  const c = selectedConversation.value
  if (!c) return false
  return c.window_state === 'open' || c.window_state === 'warn'
})

function openTemplateModal(tpl?: WaInboxTemplate) {
  templatePreselect.value = tpl ?? null
  templateModalOpen.value = true
}

const filterOptions: { value: WaInboxFilter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'sin-asignar', label: 'Sin asignar' },
  { value: 'mis', label: 'Mis chats' },
  { value: 'cerradas', label: 'Cerradas' }
]

const assignSelectItems = computed(() => [
  { label: 'Sin asignar', value: 0 },
  ...assignableUsers.value.map((u) => ({ label: u.name, value: u.id }))
])

function convRowClass(c: WaInboxConversation) {
  const classes: string[] = ['hover:bg-elevated/50']
  if (selectedConversationId.value === c.id) {
    classes.push('border-l-2 border-l-primary bg-elevated/80')
  }
  if (c.unread_count > 0 && selectedConversationId.value !== c.id) {
    classes.push('bg-elevated/40')
  }
  return classes
}

function windowDotClass(state: WaInboxWindowState) {
  if (state === 'open') return 'bg-success'
  if (state === 'warn') return 'bg-warning'
  return 'bg-error'
}

function windowBadgeColor(state: WaInboxWindowState): 'success' | 'warning' | 'error' {
  if (state === 'open') return 'success'
  if (state === 'warn') return 'warning'
  return 'error'
}

function deliveryIcon(status?: string | null) {
  if (status === 'read') return '✓✓'
  if (status === 'delivered') return '✓✓'
  if (status === 'sent') return '✓'
  if (status === 'failed') return '✗'
  if (status === 'pending') return '🕐'
  return ''
}

function onAssign(val: number | undefined) {
  assignConversation(val && val > 0 ? val : null)
}

onMounted(() => {
  init()
})

onUnmounted(() => {
  disconnectWebSocket()
})
</script>
