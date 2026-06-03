import type { Ref } from 'vue'
import type ChatMessagesScroll from '~/components/chat/ChatMessagesScroll.vue'
import type { WaInboxMessage } from '~/types/whatsapp-inbox'

const NEAR_BOTTOM_PX = 80

export function useWaInboxChatScroll(messages: Ref<WaInboxMessage[]>) {
  const scrollRef = ref<InstanceType<typeof ChatMessagesScroll> | null>(null)
  const isNearBottom = ref(true)
  const newBelowCount = ref(0)

  const showJumpButton = computed(
    () => !isNearBottom.value && messages.value.length > 0
  )

  function getScrollEl(): HTMLElement | null {
    const exposed = scrollRef.value as { scrollRef?: HTMLElement | null } | null
    return exposed?.scrollRef ?? null
  }

  function measureNearBottom() {
    const el = getScrollEl()
    if (!el) {
      isNearBottom.value = true
      return
    }
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    isNearBottom.value = distance < NEAR_BOTTOM_PX
    if (isNearBottom.value) {
      newBelowCount.value = 0
    }
  }

  function onMessagesScroll() {
    measureNearBottom()
  }

  async function scrollToBottom(smooth = true) {
    await nextTick()
    const el = getScrollEl()
    if (!el) return
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    } else {
      el.scrollTop = el.scrollHeight
    }
    isNearBottom.value = true
    newBelowCount.value = 0
  }

  function jumpToBottom() {
    scrollToBottom(true)
  }

  function resetScrollState() {
    isNearBottom.value = true
    newBelowCount.value = 0
  }

  watch(
    messages,
    (list, prev) => {
      const prevLen = prev?.length ?? 0
      if (list.length <= prevLen) return

      nextTick(() => {
        measureNearBottom()
        if (isNearBottom.value) {
          scrollToBottom(false)
        } else {
          newBelowCount.value += list.length - prevLen
        }
      })
    },
    { deep: true }
  )

  return {
    scrollRef,
    isNearBottom,
    newBelowCount,
    showJumpButton,
    onMessagesScroll,
    scrollToBottom,
    jumpToBottom,
    resetScrollState,
    measureNearBottom
  }
}
