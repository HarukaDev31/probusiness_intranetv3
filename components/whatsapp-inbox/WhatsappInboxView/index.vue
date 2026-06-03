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
          <div class="mb-2 flex items-center justify-between gap-2">
            <h2 class="text-sm font-bold text-highlighted">Conversaciones</h2>
            <div class="flex items-center gap-1">
              <UButton
                icon="i-heroicons-user-plus"
                color="primary"
                variant="soft"
                size="xs"
                aria-label="Nuevo contacto"
                @click="newContactOpen = true"
              />
              <UBadge v-if="unreadTotal" color="primary" size="xs">{{ unreadTotal }}</UBadge>
            </div>
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
        <div
          class="min-h-0 flex-1 overflow-y-auto"
          @scroll="onConversationsScroll"
        >
          <p v-if="loadingConversations && !conversations.length" class="p-4 text-center text-xs text-muted">
            Cargando…
          </p>
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
              <span class="text-[10px] text-muted">{{ formatConversationTime(c) }}</span>
              <UBadge v-if="c.unread_count" color="primary" size="xs">{{ c.unread_count }}</UBadge>
            </div>
          </button>
          <p
            v-if="loadingMoreConversations"
            class="py-3 text-center text-xs text-muted"
          >
            Cargando más…
          </p>
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
            <UButton
              icon="i-heroicons-document-text"
              color="primary"
              variant="soft"
              size="sm"
              label="Plantillas"
              @click="templatePickerOpen = true"
            />
          </div>
        </template>

        <div v-if="selectedConversation" class="relative flex min-h-0 flex-1 flex-col">
          <ChatMessagesScroll
            ref="messagesScrollRef"
            class="min-h-0 flex-1 p-4"
            @scroll="onMessagesScroll"
          >
            <p v-if="loadingMessages" class="py-8 text-center text-sm text-muted">Cargando mensajes…</p>
            <template v-else>
              <div
                v-for="msg in messages"
                :key="msg.id"
                class="group mb-2 flex flex-col"
                :class="msg.direction === 'out' ? 'items-end' : 'items-start'"
              >
                <div
                  class="flex min-w-0 max-w-[85%] items-end gap-1"
                  :class="msg.direction === 'out' ? 'flex-row-reverse' : 'flex-row'"
                >
                  <WhatsappInboxMessageBody
                    class="min-w-0 flex-1"
                    :msg="msg"
                    :direction="msg.direction"
                    :reply-preview="replyPreviewFor(msg)"
                  />
                  <UButton
                    v-if="msg.meta_message_id && selectedConversation?.can_send_text"
                    type="button"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    icon="i-heroicons-arrow-uturn-left"
                    class="shrink-0 opacity-0 transition group-hover:opacity-100"
                    title="Responder"
                    @click="iniciarRespuesta(msg)"
                  />
                </div>
                <span class="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                  <span>{{ formatMessageTime(msg) }}</span>
                  <UTooltip
                    v-if="msg.direction === 'out'"
                    :text="deliveryTooltip(msg)"
                    :delay-duration="150"
                  >
                    <span
                      class="inline-flex size-6 cursor-default items-center justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      tabindex="0"
                      :aria-label="deliveryTooltip(msg)"
                    >
                      <UIcon
                        v-if="msg.delivery_status === 'pending'"
                        name="i-heroicons-clock"
                        class="size-4 shrink-0 text-warning"
                      />
                      <span
                        v-else
                        class="select-none text-lg font-bold leading-none tracking-tighter"
                        :class="deliveryStatusClass(msg.delivery_status)"
                      >
                        {{ deliveryIcon(msg.delivery_status) }}
                      </span>
                    </span>
                  </UTooltip>
                </span>
              </div>
            </template>
          </ChatMessagesScroll>
          <WhatsappInboxJumpToBottomButton
            :visible="showJumpButton && !loadingMessages"
            :count="newBelowCount"
            @click="jumpToBottom"
          />
        </div>

        <div v-else class="flex flex-1 items-center justify-center text-sm text-muted">
          Selecciona una conversación
        </div>

        <template v-if="selectedConversation" #footer>
          <WhatsappInboxComposer
            :can-send="selectedConversation.can_send_text"
            :sending="sendingMessage"
            :reply-target="replyTarget"
            @send="onComposerSend"
            @cancel-reply="replyTarget = null"
          />
        </template>
      </ChatPanelShell>
    </div>

    <WhatsappInboxTemplatePickerModal
      v-model:open="templatePickerOpen"
      :templates="templates"
      :loading="loadingTemplates"
      @select="onTemplatePicked"
    />
    <WhatsappInboxTemplateParamsModal
      v-model:open="templateParamsOpen"
      :template="templateForParams"
      :sending="sendingTemplate"
      @send="onTemplateSend"
      @error="(msg) => showTemplateError(msg)"
    />
    <WhatsappInboxNewContactModal
      v-model:open="newContactOpen"
      :assignable-users="assignableUsers"
      :saving="savingNewContact"
      @save="onNewContactSave"
    />
  </UCard>
</template>

<script setup lang="ts">
import type {
  WaInboxConversation,
  WaInboxFilter,
  WaInboxMessage,
  WaInboxTemplate,
  WaInboxWindowState,
  WaInboxComposerReplyTarget,
  WaInboxComposerSendPayload
} from '~/types/whatsapp-inbox'
import ChatMessagesScroll from '~/components/chat/ChatMessagesScroll.vue'
import ChatPanelShell from '~/components/chat/ChatPanelShell.vue'
import WhatsappInboxTemplatePickerModal from '~/components/whatsapp-inbox/WhatsappInboxTemplatePickerModal.vue'
import WhatsappInboxTemplateParamsModal from '~/components/whatsapp-inbox/WhatsappInboxTemplateParamsModal.vue'
import WhatsappInboxNewContactModal from '~/components/whatsapp-inbox/WhatsappInboxNewContactModal.vue'
import WhatsappInboxJumpToBottomButton from '~/components/whatsapp-inbox/WhatsappInboxJumpToBottomButton.vue'
import WhatsappInboxComposer from '~/components/whatsapp-inbox/WhatsappInboxComposer.vue'
import WhatsappInboxMessageBody from '~/components/whatsapp-inbox/WhatsappInboxMessageBody.vue'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'
import { useWaInboxChatScroll } from '~/composables/whatsapp-inbox/useWaInboxChatScroll'
import { formatDatePe } from '~/utils/formatters'

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
  sendingMessage,
  loadingConversations,
  loadingMoreConversations,
  loadMoreConversations,
  conversationsHasMore,
  loadingMessages,
  loadingTemplates,
  refreshing,
  unreadTotal,
  init,
  refreshInbox,
  selectConversation,
  sendComposerMessage,
  sendTemplateMessage,
  sendingTemplate,
  assignConversation,
  createManualContact,
  savingNewContact,
  disconnectWebSocket
} = useWhatsappInbox()

const {
  scrollRef: messagesScrollRef,
  newBelowCount,
  showJumpButton,
  onMessagesScroll,
  jumpToBottom
} = useWaInboxChatScroll(messages, selectedConversationId, loadingMessages)

const { showError: showModalError } = useModal()
const { withSpinner } = useSpinner()

const replyTarget = ref<WaInboxComposerReplyTarget | null>(null)

const templatePickerOpen = ref(false)
const templateParamsOpen = ref(false)
const templateForParams = ref<WaInboxTemplate | null>(null)
const newContactOpen = ref(false)

async function onNewContactSave(payload: {
  contact_name: string
  phone: string
  assigned_user_id: number | null
}) {
  try {
    await createManualContact(payload)
    newContactOpen.value = false
  } catch {
    /* error modal en composable */
  }
}

function onTemplatePicked(tpl: WaInboxTemplate) {
  templateForParams.value = tpl
  templateParamsOpen.value = true
}

async function onTemplateSend(payload: {
  template: WaInboxTemplate
  params: Record<string, string>
  files: Record<string, File>
  fileKinds: Record<string, string>
}) {
  await sendTemplateMessage(
    payload.template.name,
    payload.params,
    payload.files,
    payload.fileKinds
  )
  templateParamsOpen.value = false
  templateForParams.value = null
}

function showTemplateError(message: string) {
  showModalError('Archivo', message)
}

function replyPreviewFor(msg: WaInboxMessage) {
  const metaId = msg.reply_to_meta_message_id
  if (!metaId) return null
  const original = messages.value.find((m) => m.meta_message_id === metaId)
  if (!original) {
    return { metaId, label: 'Mensaje', text: '…', imageUrl: null }
  }
  return {
    metaId,
    label: original.direction === 'out' ? 'Tú' : (selectedConversation.value?.contact_name || 'Cliente'),
    text: original.body?.trim() || etiquetaMedia(original),
    imageUrl: original.message_type === 'image' ? original.media_url : null
  }
}

function etiquetaMedia(msg: WaInboxMessage) {
  if (msg.media_url) {
    if (msg.message_type === 'image') return 'Foto'
    if (msg.message_type === 'video') return 'Video'
    if (msg.message_type === 'audio') return 'Audio'
    return msg.media_filename || 'Documento'
  }
  return 'Mensaje'
}

function iniciarRespuesta(msg: WaInboxMessage) {
  if (!msg.meta_message_id) return
  replyTarget.value = {
    metaMessageId: msg.meta_message_id,
    label: msg.direction === 'out' ? 'Tú' : (selectedConversation.value?.contact_name || 'Cliente'),
    text: msg.body?.trim() || etiquetaMedia(msg),
    imageUrl: msg.message_type === 'image' ? msg.media_url : null
  }
}

async function onComposerSend(payload: WaInboxComposerSendPayload) {
  try {
    await withSpinner(async () => {
      await sendComposerMessage(payload)
    }, 'Enviando…')
  } catch {
    /* modal en composable */
  }
}

watch(selectedConversationId, () => {
  replyTarget.value = null
})

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
  return ''
}

function deliveryStatusClass(status?: string | null) {
  if (status === 'failed') return 'text-error'
  if (status === 'read') return 'text-info'
  if (status === 'delivered') return 'text-highlighted'
  if (status === 'sent') return 'text-muted'
  return 'text-muted'
}

function formatMessageTime(msg: WaInboxMessage) {
  if (msg.sent_at) return formatDatePe(msg.sent_at)
  return msg.time_label || ''
}

function formatConversationTime(c: WaInboxConversation) {
  if (c.last_message_at) return formatDatePe(c.last_message_at)
  return c.last_message_time_label || ''
}

function deliveryTooltip(msg: WaInboxMessage) {
  const status = msg.delivery_status
  if (status === 'failed') {
    return msg.failed_reason?.trim() || 'No se entregó al WhatsApp del cliente'
  }
  if (status === 'pending') return 'Enviando…'
  if (status === 'sent') return 'Enviado (aceptado por Meta)'
  if (status === 'delivered') return 'Entregado al teléfono'
  if (status === 'read') return 'Leído por el cliente'
  return 'Estado de envío'
}

function onAssign(val: number | undefined) {
  assignConversation(val && val > 0 ? val : null)
}

function onConversationsScroll(e: Event) {
  const el = e.target as HTMLElement
  if (!el || !conversationsHasMore.value || loadingMoreConversations.value) return
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
  if (nearBottom) loadMoreConversations()
}

onMounted(() => {
  init()
})

onUnmounted(() => {
  disconnectWebSocket()
})
</script>
