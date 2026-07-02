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

function isHistoryPrepend(prev: WaInboxMessage[], next: WaInboxMessage[]): boolean {
  if (!prev.length || next.length <= prev.length) return false
  const prevFirst = waMessageNumericId(prev[0]?.id)
  const prevLast = waMessageNumericId(prev[prev.length - 1]?.id)
  const nextFirst = waMessageNumericId(next[0]?.id)
  const nextLast = waMessageNumericId(next[next.length - 1]?.id)
  return prevFirst > 0 && nextFirst !== prevFirst && nextLast === prevLast
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
  let prependAnchor: { scrollTop: number; scrollHeight: number } | null = null

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
    if (!isNearBottom.value) {
      pendingOpenScroll.value = false
      stopOpenScrollObservers()
    }
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

  function restorePrependScroll(anchor: { scrollTop: number; scrollHeight: number }) {
    nextTick(() => {
      requestAnimationFrame(() => {
        const el = getScrollEl()
        if (!el) return
        const delta = el.scrollHeight - anchor.scrollHeight
        if (delta > 0) {
          const prev = el.style.scrollBehavior
          el.style.scrollBehavior = 'auto'
          el.scrollTop = anchor.scrollTop + delta
          el.style.scrollBehavior = prev
        }
        measureNearBottom()
      })
    })
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

    if (!isNearBottom.value) {
      pendingOpenScroll.value = false
      stopOpenScrollObservers()
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
    prependAnchor = null
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
    if (wasLoading && !loading && isNearBottom.value) {
      pendingOpenScroll.value = true
      void tryPendingOpenScroll()
    }
  })

  watch(scrollRef, () => {
    if (pendingOpenScroll.value) {
      void tryPendingOpenScroll()
    }
  })

  /** Captura scroll antes de insertar historial arriba (carga paginada / merge). */
  watch(
    messages,
    (list, prevList) => {
      const prev = prevList ?? []
      if (!isHistoryPrepend(prev, list)) return

      const el = getScrollEl()
      if (!el) return

      prependAnchor = { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight }
      pendingOpenScroll.value = false
      stopOpenScrollObservers()
    },
    { flush: 'pre' }
  )

  watch(messages, (list, prevList) => {
    const prev = prevList ?? []

    if (prependAnchor) {
      const anchor = prependAnchor
      prependAnchor = null
      restorePrependScroll(anchor)
      return
    }

    if (pendingOpenScroll.value && list.length > 0) {
      void tryPendingOpenScroll()
      return
    }

    if (list.length <= prev.length) return

    const prevLast = waMessageNumericId(prev[prev.length - 1]?.id)
    const curLast = waMessageNumericId(list[list.length - 1]?.id)
    if (!curLast || curLast === prevLast) return

    const prevLastIdx = prevLast
      ? list.findIndex((m) => waMessageNumericId(m.id) === prevLast)
      : -1
    const added = prevLastIdx >= 0 ? list.slice(prevLastIdx + 1) : []
    if (!added.length) return

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
  })

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
