import type { Ref } from 'vue'
import type ChatMessagesScroll from '~/components/chat/ChatMessagesScroll.vue'
import type { WaInboxMessage } from '~/types/whatsapp-inbox'

const NEAR_BOTTOM_PX = 80

export function useWaInboxChatScroll(
  messages: Ref<WaInboxMessage[]>,
  conversationId: Ref<number | null>
) {
  const scrollRef = ref<InstanceType<typeof ChatMessagesScroll> | null>(null)
  const isNearBottom = ref(true)
  const newBelowCount = ref(0)
  const pendingOpenScroll = ref(false)

  /** Solo mensajes entrantes (cliente → yo) mientras no estoy abajo. */
  const showJumpButton = computed(() => newBelowCount.value > 0)

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
    await nextTick()
    isNearBottom.value = true
    newBelowCount.value = 0
  }

  function jumpToBottom() {
    scrollToBottom(true)
  }

  function resetScrollState() {
    isNearBottom.value = true
    newBelowCount.value = 0
    pendingOpenScroll.value = false
  }

  watch(conversationId, (id, prevId) => {
    if (id === prevId) return
    resetScrollState()
    pendingOpenScroll.value = id != null
  })

  watch(
    messages,
    (list, prev) => {
      const prevLen = prev?.length ?? 0

      if (pendingOpenScroll.value && list.length > 0) {
        nextTick(() => {
          scrollToBottom(false)
          pendingOpenScroll.value = false
        })
        return
      }

      if (list.length <= prevLen) return

      const added = list.slice(prevLen)
      const incomingCount = added.filter((m) => m.direction === 'in').length
      const hasOutbound = added.some((m) => m.direction === 'out')

      nextTick(() => {
        if (hasOutbound) {
          scrollToBottom(false)
          return
        }

        measureNearBottom()
        if (isNearBottom.value) {
          scrollToBottom(false)
        } else if (incomingCount > 0) {
          newBelowCount.value += incomingCount
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
