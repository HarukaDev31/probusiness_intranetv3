<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
                           <div
          v-if="visible"
          class="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          @click.self="handleBackdropClick"
        >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        
        <!-- Modal -->
        <div
          class="relative w-full max-w-md transform rounded-xl bg-white shadow-2xl ring-1 ring-black/5"
          :class="modalClasses"
        >
          <!-- Icon and Close Button -->
          <div class="flex items-start justify-between p-6 pb-4">
            <div class="flex items-center">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full"
                :class="iconContainerClasses"
              >
                <UIcon :name="iconComponent" class="h-6 w-6" :class="iconClasses" />
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ modal.title }}
                </h3>
              </div>
            </div>
            
            <button
              v-if="!modal.persistent"
              @click="$emit('close')"
              class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <UIcon name="i-heroicons-x-mark" class="h-5 w-5" />
            </button>
          </div>

          <!-- Content -->
          <div class="px-6 pb-6">
            <p class="text-sm text-gray-600 leading-relaxed">
              {{ modal.message }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 px-6 pb-6">
            <button
              v-if="modal.persistent"
              @click="$emit('close')"
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cerrar
            </button>
            <button
              v-else
              @click="$emit('close')"
              class="rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
              :class="buttonClasses"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { ModalData } from '~/composables/useModal'

interface Props {
  modal: ModalData
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()



const iconComponents = {
  success: 'i-heroicons-check-circle',
  error: 'i-heroicons-x-circle',
  warning: 'i-heroicons-exclamation-triangle',
  info: 'i-heroicons-information-circle'
}

const iconComponent = computed(() => iconComponents[props.modal.type])

const iconContainerClasses = computed(() => {
  const classes = {
    success: 'bg-green-100',
    error: 'bg-red-100',
    warning: 'bg-yellow-100',
    info: 'bg-blue-100'
  }
  return classes[props.modal.type]
})

const iconClasses = computed(() => {
  const classes = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600'
  }
  return classes[props.modal.type]
})

const buttonClasses = computed(() => {
  const classes = {
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    error: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
  }
  return classes[props.modal.type]
})

const modalClasses = computed(() => {
  const classes = {
    success: 'ring-green-200',
    error: 'ring-red-200',
    warning: 'ring-yellow-200',
    info: 'ring-blue-200'
  }
  return classes[props.modal.type]
})

const handleBackdropClick = () => {
  if (!props.modal.persistent) {
    emit('close')
  }
}

// Close modal on Escape key
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !props.modal.persistent) {
      emit('close')
    }
  }
  
  document.addEventListener('keydown', handleEscape)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
  })
})
</script> 