<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isSpinning"
        class="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <div class="bg-white rounded-lg p-6 shadow-2xl max-w-sm w-full mx-4">
          <div class="flex items-center space-x-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div>
              <p class="text-sm font-medium text-gray-900">{{ spinnerMessage }}</p>
              <p class="text-xs text-gray-500">Por favor espere...</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { isSpinning, spinnerMessage } = useSpinner()

// Debug logs
watch(isSpinning, (newValue) => {
  console.log('🎯 Spinner visibility changed:', newValue)
})

watch(spinnerMessage, (newValue) => {
  console.log('📝 Spinner message changed:', newValue)
})
</script> 