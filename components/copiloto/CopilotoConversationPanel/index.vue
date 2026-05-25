<template>
  <section v-if="lead" class="flex min-h-0 min-w-0 flex-1 flex-col bg-white dark:bg-gray-900">
    <ChatConversationHeader
      :avatar-text="lead.av"
      :title="lead.name"
      :subtitle="lead.sub"
    >
      <template v-if="!readonly" #actions>
        <UButton icon="i-heroicons-document-text" color="neutral" variant="ghost" size="xs" title="Nota interna" />
        <UButton icon="i-heroicons-arrow-top-right-on-square" color="neutral" variant="ghost" size="xs" title="Bitrix24" />
        <UButton icon="i-heroicons-phone" color="neutral" variant="ghost" size="xs" title="Llamadas" />
      </template>
    </ChatConversationHeader>

    <div class="flex shrink-0 border-b border-default px-2">
      <UButton
        :color="mainTab === 'wa' ? 'primary' : 'neutral'"
        :variant="mainTab === 'wa' ? 'soft' : 'ghost'"
        size="xs"
        icon="i-heroicons-chat-bubble-left-right"
        label="WhatsApp"
        class="rounded-none"
        @click="emit('update:mainTab', 'wa')"
      />
      <UButton
        :color="mainTab === 'calls' ? 'primary' : 'neutral'"
        :variant="mainTab === 'calls' ? 'soft' : 'ghost'"
        size="xs"
        icon="i-heroicons-phone"
        label="Llamadas"
        class="rounded-none"
        @click="emit('update:mainTab', 'calls')"
      />
    </div>

    <div
      v-if="mainTab === 'wa' && suggestion"
      class="shrink-0 border-b px-3 py-2 text-xs"
      :style="{ background: suggestion.cfg.sBg, borderColor: suggestion.cfg.sBrd }"
    >
      <p class="flex items-center gap-1 font-semibold" :style="{ color: suggestion.cfg.sLbl }">
        <UIcon name="i-heroicons-sparkles" class="size-3.5" />
        {{ suggestion.label }}
      </p>
      <p class="mt-1 leading-snug" :style="{ color: suggestion.cfg.sTxt }">{{ suggestion.text }}</p>
      <div v-if="!readonly" class="mt-2 flex flex-wrap gap-1">
        <UButton
          size="xs"
          color="neutral"
          variant="soft"
          label="Responder con cotización"
          @click="emit('apply-chip', 'Te comparto la cotización actualizada con flete fijo y tiempos de tránsito.')"
        />
      </div>
    </div>

    <ChatPanelShell v-if="mainTab === 'wa'" :full-height="false" class="min-h-0 flex-1">
      <ChatMessagesScroll ref="scrollRef" class="flex-1">
        <template v-for="(msg, mi) in lead.msgs" :key="mi">
          <div v-if="msg.dir === 'sys'" class="w-full py-1 text-center">
            <UBadge color="neutral" variant="subtle" size="xs">{{ msg.txt }}</UBadge>
          </div>
          <div v-else-if="msg.dir === 'out'" class="flex flex-col items-end gap-0.5">
            <UCard color="primary" variant="solid" :ui="{ body: 'px-3 py-2 text-sm' }">
              {{ msg.txt }}
            </UCard>
            <span class="text-[10px] text-muted">{{ msg.t }}</span>
          </div>
          <div v-else class="flex gap-2">
            <div
              class="mt-2 w-1 shrink-0 rounded-full"
              :style="{ background: tempCfg(msg.temp ?? 0).bar, minHeight: '24px' }"
            />
            <div class="min-w-0 flex-1">
              <UCard
                variant="soft"
                color="neutral"
                :ui="{ body: 'px-3 py-2 text-sm border-s-2', root: 'border-s-2' }"
                :style="{ borderLeftColor: tempCfg(msg.temp ?? 0).bar }"
              >
                {{ msg.txt }}
              </UCard>
              <div v-if="msg.temp != null" class="mt-1 flex flex-wrap items-center gap-1">
                <UBadge
                  size="xs"
                  variant="subtle"
                  class="cursor-pointer"
                  :style="{ background: tempCfg(msg.temp).bg, color: tempCfg(msg.temp).color }"
                  @click="emit('toggle-insight', mi)"
                >
                  <UIcon :name="tempCfg(msg.temp).icon" class="size-3" />
                  {{ msg.temp }}% {{ tempCfg(msg.temp).lbl }}
                </UBadge>
                <UBadge
                  v-for="sig in msg.sigs || []"
                  :key="sig"
                  size="xs"
                  variant="outline"
                  color="neutral"
                >
                  {{ sig }}
                </UBadge>
              </div>
              <p v-if="expandedMessageIndex === mi && msg.why" class="mt-1 text-[10px] text-muted">
                {{ msg.why }}
              </p>
              <span class="text-[10px] text-muted">{{ msg.t }}</span>
            </div>
          </div>
        </template>
      </ChatMessagesScroll>
      <template v-if="!readonly" #footer>
        <ChatComposerSimple
          v-model="draftModel"
          placeholder="Escribe un mensaje al cliente..."
          @send="emit('send')"
        />
      </template>
    </ChatPanelShell>

    <div v-else class="flex min-h-0 flex-1 flex-col p-4 text-sm text-muted">
      <UAlert
        color="info"
        variant="subtle"
        icon="i-heroicons-information-circle"
        title="Llamadas"
        description="Las grabaciones se capturan desde VoIP al finalizar cada llamada."
      />
      <div class="mt-4 flex flex-1 items-center justify-center text-xs">
        Sin grabaciones en esta demo.
      </div>
      <UButton
        v-if="!readonly"
        block
        color="neutral"
        variant="outline"
        size="sm"
        icon="i-heroicons-cloud-arrow-up"
        label="Subir grabación manualmente"
        class="mt-auto"
      />
    </div>
  </section>
  <section v-else class="flex flex-1 items-center justify-center bg-white text-sm text-muted dark:bg-gray-900">
    Selecciona un lead de la cola
  </section>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import type { CopilotoLead } from '~/types/copiloto/lead'
import type { CopilotoMainTab } from '~/composables/copiloto/useCopilotoDashboard'
import { getCopilotoTempConfig } from '~/constants/copiloto/temperature'
import ChatPanelShell from '~/components/chat/ChatPanelShell.vue'
import ChatMessagesScroll from '~/components/chat/ChatMessagesScroll.vue'
import ChatComposerSimple from '~/components/chat/ChatComposerSimple.vue'
import ChatConversationHeader from '~/components/chat/ChatConversationHeader.vue'

const props = defineProps<{
  lead: CopilotoLead | null
  mainTab: CopilotoMainTab
  draftMessage: string
  readonly?: boolean
  expandedMessageIndex: number | null
  suggestion: { label: string; text: string; cfg: ReturnType<typeof getCopilotoTempConfig> } | null
}>()

const emit = defineEmits<{
  'update:mainTab': [tab: CopilotoMainTab]
  'update:draftMessage': [text: string]
  send: []
  'toggle-insight': [index: number]
  'apply-chip': [text: string]
}>()

const draftModel = computed({
  get: () => props.draftMessage,
  set: (v: string) => emit('update:draftMessage', v)
})

const scrollRef = ref<InstanceType<typeof ChatMessagesScroll> | null>(null)
const tempCfg = getCopilotoTempConfig

watch(
  () => props.lead?.msgs.length,
  async () => {
    await nextTick()
    scrollRef.value?.scrollToBottom()
  },
  { flush: 'post' }
)
</script>
