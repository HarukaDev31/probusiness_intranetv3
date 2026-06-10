<template>
  <Transition
    enter-active-class="transition duration-150 ease-out"
    enter-from-class="opacity-0 -translate-y-1"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-100 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-1"
  >
    <div
      v-if="visible && label"
      class="pointer-events-none absolute inset-x-0 top-2 z-20 flex justify-center"
    >
      <span
        class="rounded-md bg-neutral-800/90 px-2.5 py-0.5 text-xs font-semibold text-neutral-100 shadow-md dark:bg-neutral-700/95"
      >
        {{ label }}
      </span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  visible: boolean
}>()
</script>
