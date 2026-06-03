import type { Ref } from 'vue'
import type ChatMessagesScroll from '~/components/chat/ChatMessagesScroll.vue'
import type { WaInboxMessage } from '~/types/whatsapp-inbox'

const NEAR_BOTTOM_PX = 80
const OPEN_SCROLL_MAX_ATTEMPTS = 10

function waMessageNumericId(id: unknown): number {
  const n = Number(id)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export function useWaInboxChatScroll(
  messages: Ref<WaInboxMessage[]>,
  conversationId: Ref<number | null>,
  loadingMessages: Ref<boolean> = ref(false)
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

  function isAtBottom(el: HTMLElement): boolean {
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    return distance < NEAR_BOTTOM_PX
  }

  async function scrollToBottom(smooth = true) {
    await nextTick()
    const el = getScrollEl()
    if (!el) return false
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    } else {
      el.scrollTop = el.scrollHeight
    }
    await nextTick()
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    isNearBottom.value = isAtBottom(el)
    if (isNearBottom.value) {
      newBelowCount.value = 0
    }
    return isNearBottom.value
  }

  /** Tras abrir chat o recargar: espera DOM, fin de loading y altura estable. */
  async function flushOpenScroll() {
    if (!conversationId.value || loadingMessages.value || messages.value.length === 0) {
      return false
    }

    for (let attempt = 0; attempt < OPEN_SCROLL_MAX_ATTEMPTS; attempt++) {
      await nextTick()
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

      const el = getScrollEl()
      if (!el) continue

      el.scrollTop = el.scrollHeight
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

      if (isAtBottom(el)) {
        isNearBottom.value = true
        newBelowCount.value = 0
        pendingOpenScroll.value = false
        return true
      }
    }

    return scrollToBottom(false)
  }

  async function tryPendingOpenScroll() {
    if (!pendingOpenScroll.value) return
    const ok = await flushOpenScroll()
    if (ok) {
      pendingOpenScroll.value = false
    }
  }

  function jumpToBottom() {
    pendingOpenScroll.value = false
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
    if (id != null) {
      void tryPendingOpenScroll()
    }
  })

  watch(loadingMessages, (loading, wasLoading) => {
    if (wasLoading && !loading) {
      void tryPendingOpenScroll()
    }
  })

  watch(scrollRef, () => {
    void tryPendingOpenScroll()
  })

  watch(
    () => messages.value.length,
    () => {
      void tryPendingOpenScroll()
    }
  )

  watch(
    () => {
      const list = messages.value
      if (!list.length) return '0'
      const last = list[list.length - 1]
      return `${list.length}:${waMessageNumericId(last.id)}:${last.direction}`
    },
    (sig, prevSig) => {
      const list = messages.value
      const prevLen = prevSig ? Number(prevSig.split(':')[0]) || 0 : 0

      if (pendingOpenScroll.value && list.length > 0) {
        void tryPendingOpenScroll()
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
    }
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
