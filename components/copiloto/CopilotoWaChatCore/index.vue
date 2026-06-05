<template>
  <ChatPanelShell v-if="conversation" :full-height="false" class="min-h-0 flex-1">
    <div class="relative flex min-h-0 flex-1 flex-col">
      <ChatMessagesScroll
        ref="scrollRef"
        class="min-h-0 flex-1 p-3"
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
            </div>
            <span class="mt-0.5 text-[11px] text-muted">{{ formatTime(msg) }}</span>
          </div>
        </template>
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
        :reply-target="replyTarget"
        @send="onSend"
        @cancel-reply="replyTarget = null"
      />
    </template>
  </ChatPanelShell>
</template>

<script setup lang="ts">
import { ref, toRef, computed } from 'vue'
import type {
  WaCopilotoComposerSendPayload,
  WaCopilotoConversation,
  WaCopilotoMessage
} from '~/types/wa-copiloto'
import type { WaInboxComposerReplyTarget } from '~/types/whatsapp-inbox'
import ChatPanelShell from '~/components/chat/ChatPanelShell.vue'
import ChatMessagesScroll from '~/components/chat/ChatMessagesScroll.vue'
import WhatsappInboxMessageBody from '~/components/whatsapp-inbox/WhatsappInboxMessageBody.vue'
import WhatsappInboxComposer from '~/components/whatsapp-inbox/WhatsappInboxComposer.vue'
import WhatsappInboxJumpToBottomButton from '~/components/whatsapp-inbox/WhatsappInboxJumpToBottomButton.vue'
import { useWaCopilotoChatScroll } from '~/composables/wa-copiloto-inbox/useWaCopilotoChatScroll'

const props = withDefaults(
  defineProps<{
    conversation: WaCopilotoConversation | null
    messages: WaCopilotoMessage[]
    loadingMessages?: boolean
    sendingMessage?: boolean
    readonly?: boolean
    composerDraft?: string
  }>(),
  {
    loadingMessages: false,
    sendingMessage: false,
    readonly: false,
    composerDraft: ''
  }
)

const emit = defineEmits<{
  send: [payload: WaCopilotoComposerSendPayload]
  'update:composerDraft': [value: string]
}>()

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
</script>
