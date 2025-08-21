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
        class="fixed inset-0 flex items-center justify-center p-4 z-[8000] pointer-events-auto"
        @click.self.stop="handleBackdropClick"
      >
        <!-- Backdrop -->
        <div 
          class="absolute inset-0 bg-black/50 backdrop-blur-sm" 
          style="pointer-events: none;"
        ></div>
        
        <!-- Modal -->
        <div
          class="relative w-full max-w-md transform rounded-xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-gray-700 z-[8001]"
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
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ modal.title }}
                </h3>
              </div>
            </div>
            
            <button
              v-if="!modal.persistent"
              @click="$emit('close')"
              class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
            >
              <UIcon name="i-heroicons-x-mark" class="h-5 w-5" />
            </button>
          </div>

          <!-- Content -->
          <div class="px-6 pb-6">
            <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {{ modal.message }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 px-6 pb-6">
            <!-- Modal de confirmación con botones Cancelar/Confirmar -->
            <template v-if="modal.type === 'confirmation'">
              <button
                @click="$emit('cancel')"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                Cancelar
              </button>
              <button
                @click="$emit('confirm')"
                class="rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                :class="buttonClasses"
              >
                Confirmar
              </button>
            </template>
            
            <!-- Modal persistente con botón Cerrar -->
            <button
              v-else-if="modal.persistent"
              @click="$emit('close')"
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              Cerrar
            </button>
            
            <!-- Modal normal con botón Entendido -->
            <button
              v-else
              @click="$emit('close')"
              class="rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
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
import type { ModalData } from '../composables/commons/useModal'

interface Props {
  modal: ModalData
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  confirm: []
  cancel: []
}>()

const iconComponents = {
  success: 'i-heroicons-check-circle',
  error: 'i-heroicons-x-circle',
  warning: 'i-heroicons-exclamation-triangle',
  info: 'i-heroicons-information-circle',
  confirmation: 'i-heroicons-question-mark-circle'
}

const iconComponent = computed(() => iconComponents[props.modal.type])

const iconContainerClasses = computed(() => {
  const classes = {
    success: 'bg-green-100 dark:bg-green-900/30',
    error: 'bg-red-100 dark:bg-red-900/30',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30',
    info: 'bg-blue-100 dark:bg-blue-900/30',
    confirmation: 'bg-gray-100 dark:bg-gray-700'
  }
  return classes[props.modal.type]
})

const iconClasses = computed(() => {
  const classes = {
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    info: 'text-blue-600 dark:text-blue-400',
    confirmation: 'text-gray-600 dark:text-gray-400'
  }
  return classes[props.modal.type]
})

const buttonClasses = computed(() => {
  const classes = {
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-400',
    error: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-400',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 dark:bg-yellow-600 dark:hover:bg-yellow-700 dark:focus:ring-yellow-400',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-400',
    confirmation: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-400'
  }
  return classes[props.modal.type]
})

const modalClasses = computed(() => {
  const classes = {
    success: 'ring-green-200 dark:ring-green-800',
    error: 'ring-red-200 dark:ring-red-800',
    warning: 'ring-yellow-200 dark:ring-yellow-800',
    info: 'ring-blue-200 dark:ring-blue-800',
    confirmation: 'ring-gray-200 dark:ring-gray-700'
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