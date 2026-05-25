<template>
  <div
    ref="scrollRef"
    class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto scroll-smooth px-3 py-4 sm:px-4"
    :class="bodyClass"
    @scroll="onScroll"
  >
    <slot />
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
  scrollToBottom
})
</script>
