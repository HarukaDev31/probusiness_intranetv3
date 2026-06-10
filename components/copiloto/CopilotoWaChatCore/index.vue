<template>
  <ChatPanelShell v-if="conversation" :full-height="false" class="min-h-0 flex-1">
    <div class="relative flex min-h-0 flex-1 flex-col">
      <ChatMessagesScroll
        ref="scrollRef"
        class="min-h-0 flex-1 p-3"
        @scroll="onMessagesScroll"
      >
        <CopilotoChatSkeleton v-if="loadingMessages && !messages.length" />
        <template v-else>
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="group mb-2 flex flex-col"
            :class="msg.direction === 'out' ? 'items-end' : 'items-start'"
          >
            <div
              class="flex min-w-0 max-w-[92%] flex-col"
              :class="msg.direction === 'out' ? 'items-end' : 'items-start'"
            >
              <div
                class="flex min-w-0 items-end gap-1"
                :class="msg.direction === 'out' ? 'flex-row-reverse' : 'flex-row'"
              >
                <WhatsappInboxMessageBody
                  class="max-w-full shrink-0"
                  :msg="msg"
                  :direction="msg.direction"
                  :avatar-text="audioAvatarText(msg)"
                  :time-label="formatTime(msg)"
                  :delivery-icon="msg.direction === 'out' ? deliveryIcon(msg.delivery_status) : undefined"
                  :delivery-class="msg.direction === 'out' ? deliveryStatusClass(msg.delivery_status) : undefined"
                  @media-rendered="onChatMediaRendered"
                />
                <UButton
                  v-if="!readonly && msg.meta_message_id && conversation.can_send_text"
                  type="button"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-arrow-uturn-left"
                  class="shrink-0 opacity-0 transition group-hover:opacity-100"
                  title="Responder"
                  @click="replyTarget = buildReplyTarget(msg)"
                />
              </div>
              <div
                v-if="msg.direction === 'in'"
                class="mt-1.5 w-full max-w-[min(100%,24rem)]"
              >
                <div
                  v-if="messageAnalysisPending(msg)"
                  class="flex items-center gap-2 rounded-lg border border-dashed border-primary-300/80 bg-primary-50/50 px-2.5 py-2 text-[11px] text-muted dark:border-primary-800 dark:bg-primary-950/20"
                >
                  <UIcon name="i-heroicons-sparkles" class="size-3.5 shrink-0 animate-pulse text-primary" />
                  <span>Copiloto analizando este mensaje…</span>
                </div>
                <CopilotoMessageInsights
                  v-else-if="(msg.insights ?? []).length"
                  :insights="msg.insights ?? []"
                  :selectable="!readonly"
                  @select="(insight) => onSelectInsight(msg, insight)"
                />
              </div>
            </div>
            <span
              v-if="msg.message_type !== 'audio'"
              class="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted"
            >
              <span>{{ formatTime(msg) }}</span>
              <UTooltip
                v-if="msg.direction === 'out'"
                :text="deliveryTooltip(msg.delivery_status, msg.failed_reason)"
                :delay-duration="150"
              >
                <span
                  class="inline-flex size-6 cursor-default items-center justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  tabindex="0"
                  :aria-label="deliveryTooltip(msg.delivery_status, msg.failed_reason)"
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
        <div
          v-if="loadingMessages && messages.length"
          class="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 overflow-hidden bg-transparent"
        >
          <div class="h-full w-1/3 animate-pulse rounded-full bg-primary-500/80" />
        </div>
      </ChatMessagesScroll>
      <WhatsappInboxJumpToBottomButton
        :visible="showJumpButton && !loadingMessages"
        :count="newBelowCount"
        @click="jumpToBottom"
      />
    </div>

    <template v-if="!readonly" #footer>
      <WhatsappInboxComposer
        v-model="composerText"
        :can-send="conversation.can_send_text"
        :sending="sendingMessage"
        :show-schedule="conversation.can_send_text"
        :reply-target="replyTarget"
        @send="onSend"
        @schedule="scheduleModalOpen = true"
        @cancel-reply="replyTarget = null"
      />
      <CopilotoScheduleMessageModal
        v-model:open="scheduleModalOpen"
        :initial-text="composerText"
        :window-expires-at="conversation.window_expires_at"
        :scheduling="schedulingMessage"
        @schedule="onSchedule"
      />
    </template>
  </ChatPanelShell>
</template>

<script setup lang="ts">
import { ref, toRef, computed } from 'vue'
import type {
  CopilotoSuggestionOption,
  WaCopilotoComposerSendPayload,
  WaCopilotoConversation,
  WaCopilotoMessage,
  WaCopilotoMessageInsight
} from '~/types/wa-copiloto'
import { waMessageNumericId } from '~/composables/wa-copiloto-inbox/waCopilotoMessageUtils'
import CopilotoMessageInsights from '~/components/copiloto/CopilotoMessageInsights/index.vue'
import CopilotoChatSkeleton from '~/components/copiloto/CopilotoChatSkeleton/index.vue'
import type { WaInboxComposerReplyTarget } from '~/types/whatsapp-inbox'
import ChatPanelShell from '~/components/chat/ChatPanelShell.vue'
import ChatMessagesScroll from '~/components/chat/ChatMessagesScroll.vue'
import WhatsappInboxMessageBody from '~/components/whatsapp-inbox/WhatsappInboxMessageBody.vue'
import WhatsappInboxComposer from '~/components/whatsapp-inbox/WhatsappInboxComposer.vue'
import WhatsappInboxJumpToBottomButton from '~/components/whatsapp-inbox/WhatsappInboxJumpToBottomButton.vue'
import CopilotoScheduleMessageModal from '~/components/copiloto/CopilotoScheduleMessageModal/index.vue'
import { useWaCopilotoChatScroll } from '~/composables/wa-copiloto-inbox/useWaCopilotoChatScroll'
import {
  deliveryIcon,
  deliveryStatusClass,
  deliveryTooltip
} from '~/utils/whatsappDeliveryStatus'

const props = withDefaults(
  defineProps<{
    conversation: WaCopilotoConversation | null
    messages: WaCopilotoMessage[]
    loadingMessages?: boolean
    sendingMessage?: boolean
    schedulingMessage?: boolean
    readonly?: boolean
    composerDraft?: string
    isMessageAnalysisPending?: (messageId: number) => boolean
  }>(),
  {
    loadingMessages: false,
    sendingMessage: false,
    schedulingMessage: false,
    readonly: false,
    composerDraft: '',
    isMessageAnalysisPending: () => false
  }
)

const emit = defineEmits<{
  send: [payload: WaCopilotoComposerSendPayload]
  schedule: [payload: { text: string; scheduledAt: string }]
  'update:composerDraft': [value: string]
  'apply-chip': [option: CopilotoSuggestionOption]
}>()

const scheduleModalOpen = ref(false)

function messageAnalysisPending(msg: WaCopilotoMessage) {
  const id = waMessageNumericId(msg.id)
  return id > 0 && props.isMessageAnalysisPending(id)
}

function onSelectInsight(msg: WaCopilotoMessage, insight: WaCopilotoMessageInsight) {
  if (insight.kind !== 'sugerencia') return
  emit('apply-chip', {
    id: `ins-${insight.id}`,
    text: insight.body,
    label: insight.label || 'Sugerencia IA',
    insightId: insight.id,
    messageId: msg.id
  })
}

const replyTarget = ref<WaInboxComposerReplyTarget | null>(null)

const composerText = computed({
  get: () => props.composerDraft,
  set: (value: string) => emit('update:composerDraft', value)
})

const {
  scrollRef,
  showJumpButton,
  newBelowCount,
  onMessagesScroll,
  scrollToBottom,
  jumpToBottom
} = useWaCopilotoChatScroll(
  toRef(props, 'messages'),
  computed(() => props.conversation?.id ?? null),
  toRef(props, 'loadingMessages')
)

function onChatMediaRendered() {
  void scrollToBottom(false)
}

function audioAvatarText(msg: WaCopilotoMessage) {
  if (msg.direction === 'out') return 'PB'
  return props.conversation?.initials || 'C'
}

function formatTime(msg: WaCopilotoMessage) {
  const raw = msg.sent_at || msg.created_at
  if (!raw) return ''
  const d = new Date(String(raw))
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function buildReplyTarget(msg: WaCopilotoMessage): WaInboxComposerReplyTarget {
  return {
    metaMessageId: String(msg.meta_message_id || ''),
    preview: msg.body || msg.message_type || 'Mensaje',
    author: msg.direction === 'out' ? 'Tú' : props.conversation?.contact_name || 'Cliente'
  }
}

function onSend(payload: WaCopilotoComposerSendPayload) {
  emit('send', {
    ...payload,
    replyToMetaMessageId: replyTarget.value?.metaMessageId || payload.replyToMetaMessageId
  })
  replyTarget.value = null
}

function onSchedule(payload: { text: string; scheduledAt: string }) {
  emit('schedule', payload)
  scheduleModalOpen.value = false
}
</script>
