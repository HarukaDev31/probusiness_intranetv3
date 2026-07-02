import { nextTick, ref, type Ref } from 'vue'
import type ChatMessagesScroll from '~/components/chat/ChatMessagesScroll.vue'
import type { WaInboxMessage } from '~/types/whatsapp-inbox'

const HIGHLIGHT_MS = 1600

function getScrollEl(scrollRef: Ref<InstanceType<typeof ChatMessagesScroll> | null>): HTMLElement | null {
  const exposed = scrollRef.value as { scrollRef?: HTMLElement | null } | null
  return exposed?.scrollRef ?? null
}

export function useWaInboxScrollToMessage(
  scrollRef: Ref<InstanceType<typeof ChatMessagesScroll> | null>,
  ensureMessage: (metaId: string) => Promise<WaInboxMessage | null>
) {
  const highlightedMetaId = ref<string | null>(null)
  let highlightTimer: ReturnType<typeof setTimeout> | null = null

  function clearHighlightTimer() {
    if (highlightTimer) {
      clearTimeout(highlightTimer)
      highlightTimer = null
    }
  }

  function flashMessage(metaId: string) {
    highlightedMetaId.value = metaId
    clearHighlightTimer()
    highlightTimer = setTimeout(() => {
      highlightedMetaId.value = null
      highlightTimer = null
    }, HIGHLIGHT_MS)
  }

  async function scrollToMessageMetaId(metaId: string) {
    const trimmed = metaId.trim()
    if (!trimmed) return false

    const msg = await ensureMessage(trimmed)
    if (!msg) return false

    await nextTick()
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

    const scrollEl = getScrollEl(scrollRef)
    if (!scrollEl) return false

    const selector = `[data-wa-msg-meta-id="${CSS.escape(trimmed)}"]`
    const target = scrollEl.querySelector<HTMLElement>(selector)
    if (!target) return false

    const targetRect = target.getBoundingClientRect()
    const scrollRect = scrollEl.getBoundingClientRect()
    const top =
      targetRect.top
      - scrollRect.top
      + scrollEl.scrollTop
      - scrollEl.clientHeight / 2
      + targetRect.height / 2

    scrollEl.scrollTo({
      top: Math.max(0, top),
      behavior: 'smooth'
    })

    flashMessage(trimmed)
    return true
  }

  return {
    highlightedMetaId,
    scrollToMessageMetaId
  }
}
