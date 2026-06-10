import { computed, nextTick, ref, watch, type Ref } from 'vue'
import type ChatMessagesScroll from '~/components/chat/ChatMessagesScroll.vue'
import type { WaInboxMessage } from '~/types/whatsapp-inbox'
import { formatWaChatDayLabel, waChatDayKey } from '~/utils/whatsappInboxChatDate'
import { isWaInboxReactionNoise } from '~/composables/whatsapp-inbox/waInboxMessageUtils'

export type WaInboxChatTimelineItem =
  | { kind: 'divider'; dayKey: string; label: string }
  | { kind: 'message'; msg: WaInboxMessage }

const FLOATING_BADGE_MIN_SCROLL = 24
const NEAR_BOTTOM_PX = 80

export function useWaInboxChatDateBadge(
  scrollRef: Ref<InstanceType<typeof ChatMessagesScroll> | null>,
  messages: Ref<WaInboxMessage[]>
) {
  const floatingDayLabel = ref('')
  const showFloatingBadge = ref(false)

  const timelineItems = computed<WaInboxChatTimelineItem[]>(() => {
    const items: WaInboxChatTimelineItem[] = []
    let lastDayKey = ''

    for (const msg of messages.value) {
      if (isWaInboxReactionNoise(msg)) continue

      const dayKey = waChatDayKey(msg.sent_at) || `unknown-${msg.id}`
      if (dayKey !== lastDayKey) {
        items.push({
          kind: 'divider',
          dayKey,
          label: formatWaChatDayLabel(msg.sent_at) || '—'
        })
        lastDayKey = dayKey
      }
      items.push({ kind: 'message', msg })
    }

    return items
  })

  function getScrollEl(): HTMLElement | null {
    const exposed = scrollRef.value as { scrollRef?: HTMLElement | null } | null
    return exposed?.scrollRef ?? null
  }

  function updateFloatingDay() {
    const el = getScrollEl()
    if (!el) {
      floatingDayLabel.value = ''
      showFloatingBadge.value = false
      return
    }

    const dividers = el.querySelectorAll<HTMLElement>('[data-wa-day-divider]')
    const scrollTop = el.scrollTop + 8
    let label = ''

    for (const divider of dividers) {
      if (divider.offsetTop <= scrollTop) {
        label = divider.dataset.waDayLabel || ''
      } else {
        break
      }
    }

    if (!label && dividers.length > 0) {
      label = dividers[0].dataset.waDayLabel || ''
    }

    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX

    floatingDayLabel.value = label
    showFloatingBadge.value =
      el.scrollTop > FLOATING_BADGE_MIN_SCROLL && !nearBottom && Boolean(label)
  }

  function onMessagesScroll() {
    updateFloatingDay()
  }

  watch(
    () => messages.value.length,
    async () => {
      await nextTick()
      updateFloatingDay()
    }
  )

  watch(timelineItems, async () => {
    await nextTick()
    updateFloatingDay()
  })

  return {
    timelineItems,
    floatingDayLabel,
    showFloatingBadge,
    onMessagesScroll,
    updateFloatingDay
  }
}
