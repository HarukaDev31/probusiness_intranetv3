import { computed, nextTick, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import type ChatMessagesScroll from '~/components/chat/ChatMessagesScroll.vue'
import type { WaInboxMessage } from '~/types/whatsapp-inbox'

const NEAR_BOTTOM_PX = 80
const OPEN_SCROLL_MAX_ATTEMPTS = 24
const OPEN_SCROLL_STABLE_READS = 2

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

  let openScrollObserver: ResizeObserver | null = null
  let openScrollMediaCleanup: (() => void) | null = null

  /** Solo mensajes entrantes (cliente → yo) mientras no estoy abajo. */
  const showJumpButton = computed(() => newBelowCount.value > 0)

  function getScrollEl(): HTMLElement | null {
    const exposed = scrollRef.value as { scrollRef?: HTMLElement | null } | null
    return exposed?.scrollRef ?? null
  }

  function getContentEl(): HTMLElement | null {
    const exposed = scrollRef.value as { contentRef?: HTMLElement | null } | null
    return exposed?.contentRef ?? null
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

  function snapScrollToBottom(el: HTMLElement) {
    const prev = el.style.scrollBehavior
    el.style.scrollBehavior = 'auto'
    el.scrollTop = el.scrollHeight
    el.style.scrollBehavior = prev
  }

  async function scrollToBottom(smooth = true) {
    await nextTick()
    const el = getScrollEl()
    if (!el) return false
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    } else {
      snapScrollToBottom(el)
    }
    await nextTick()
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    isNearBottom.value = isAtBottom(el)
    if (isNearBottom.value) {
      newBelowCount.value = 0
    }
    return isNearBottom.value
  }

  function stopOpenScrollObservers() {
    openScrollObserver?.disconnect()
    openScrollObserver = null
    openScrollMediaCleanup?.()
    openScrollMediaCleanup = null
  }

  function onOpenScrollMediaLoaded() {
    if (!pendingOpenScroll.value) return
    const el = getScrollEl()
    if (!el) return
    snapScrollToBottom(el)
    if (isAtBottom(el)) {
      isNearBottom.value = true
      newBelowCount.value = 0
    }
  }

  function startOpenScrollObservers() {
    stopOpenScrollObservers()
    if (!pendingOpenScroll.value) return

    const scrollEl = getScrollEl()
    const contentEl = getContentEl()
    if (!scrollEl) return

    const onMediaLoad = () => {
      onOpenScrollMediaLoaded()
    }
    scrollEl.addEventListener('load', onMediaLoad, true)
    scrollEl.addEventListener('loadedmetadata', onMediaLoad, true)
    openScrollMediaCleanup = () => {
      scrollEl.removeEventListener('load', onMediaLoad, true)
      scrollEl.removeEventListener('loadedmetadata', onMediaLoad, true)
    }

    if (typeof ResizeObserver === 'undefined' || !contentEl) return

    openScrollObserver = new ResizeObserver(() => {
      if (!pendingOpenScroll.value) return
      onOpenScrollMediaLoaded()
    })
    openScrollObserver.observe(contentEl)
  }

  /** Tras abrir chat o recargar: espera DOM, fin de loading y altura estable. */
  async function flushOpenScroll() {
    if (!conversationId.value || loadingMessages.value || messages.value.length === 0) {
      return false
    }

    startOpenScrollObservers()

    let stableReads = 0
    let lastHeight = -1

    for (let attempt = 0; attempt < OPEN_SCROLL_MAX_ATTEMPTS; attempt++) {
      await nextTick()
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

      const el = getScrollEl()
      if (!el) {
        await new Promise<void>((resolve) => setTimeout(resolve, 40))
        continue
      }

      snapScrollToBottom(el)
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

      const height = el.scrollHeight
      const atBottom = isAtBottom(el)

      if (atBottom && height === lastHeight) {
        stableReads += 1
      } else {
        stableReads = 0
      }
      lastHeight = height

      if (atBottom && stableReads >= OPEN_SCROLL_STABLE_READS) {
        isNearBottom.value = true
        newBelowCount.value = 0
        pendingOpenScroll.value = false
        stopOpenScrollObservers()
        return true
      }

      await new Promise<void>((resolve) => setTimeout(resolve, 50 + attempt * 25))
    }

    const ok = await scrollToBottom(false)
    if (ok) {
      pendingOpenScroll.value = false
      stopOpenScrollObservers()
    }
    return ok
  }

  async function tryPendingOpenScroll() {
    if (!pendingOpenScroll.value) return
    const ok = await flushOpenScroll()
    if (ok) {
      pendingOpenScroll.value = false
      stopOpenScrollObservers()
    }
  }

  function jumpToBottom() {
    pendingOpenScroll.value = false
    stopOpenScrollObservers()
    scrollToBottom(true)
  }

  function resetScrollState() {
    isNearBottom.value = true
    newBelowCount.value = 0
    pendingOpenScroll.value = false
    stopOpenScrollObservers()
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
      pendingOpenScroll.value = true
      void tryPendingOpenScroll()
    }
  })

  watch(scrollRef, () => {
    if (pendingOpenScroll.value) {
      void tryPendingOpenScroll()
    }
  })

  watch(
    () => messages.value.length,
    () => {
      if (pendingOpenScroll.value) {
        void tryPendingOpenScroll()
      }
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

  onBeforeUnmount(() => {
    stopOpenScrollObservers()
  })

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
