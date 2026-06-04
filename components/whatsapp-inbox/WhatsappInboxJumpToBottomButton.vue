<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-2 opacity-0 scale-95"
    enter-to-class="translate-y-0 opacity-100 scale-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100 scale-100"
    leave-to-class="translate-y-2 opacity-0 scale-95"
  >
    <button
      v-if="visible"
      type="button"
      class="absolute bottom-4 left-1/2 z-20 flex size-10 -translate-x-1/2 items-center justify-center rounded-full bg-elevated shadow-lg ring-1 ring-default transition-transform hover:scale-105 active:scale-95"
      :class="buttonClass"
      aria-label="Ir a mensajes recientes"
      @click="emit('click')"
    >
      <UIcon name="i-heroicons-chevron-down" class="size-5 text-highlighted" />
      <span
        v-if="count > 0"
        class="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-success px-1 text-[10px] font-bold leading-none text-inverted shadow-sm"
      >
        {{ count > 99 ? '99+' : count }}
      </span>
    </button>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  count?: number
  buttonClass?: string
}>()

const emit = defineEmits<{
  click: []
}>()
</script>
