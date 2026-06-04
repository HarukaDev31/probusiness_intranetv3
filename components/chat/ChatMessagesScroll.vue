<template>
  <div
    ref="scrollRef"
    class="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-auto px-3 py-4 sm:px-4"
    :class="bodyClass"
    @scroll="onScroll"
  >
    <div ref="contentRef" class="flex flex-col gap-3">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

withDefaults(
  defineProps<{
    bodyClass?: string
  }>(),
  {
    bodyClass: ''
  }
)

const emit = defineEmits<{
  scroll: [event: Event]
}>()

const scrollRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)

function onScroll(event: Event) {
  emit('scroll', event)
}

async function scrollToBottom() {
  await nextTick()
  const el = scrollRef.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

defineExpose({
  scrollRef,
  contentRef,
  scrollToBottom
})
</script>
