<template>
  <div class="mb-2">
    <div class="w-full flex flex-col md:flex-row gap-2 md:gap-4">
      <div class="flex items-center md:mr-4 justify-between md:justify-start w-full md:w-auto">
        <UButton
          v-if="!hideBackButton"
          @click="$emit('back')"
          :aria-label="currentRole === ROLES.CONTENEDOR_ALMACEN ? 'Back' : 'Regresar'"
          color="primary"
          variant="subtle"
          class="flex items-center gap-3 px-2 py-2 md:px-4 md:py-2 text-sm md:text-base w-fit md:w-auto"
        >
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          <span class=" md:inline whitespace-nowrap">{{ currentRole === ROLES.CONTENEDOR_ALMACEN ? 'Back' : 'Regresar' }}</span>
        </UButton>

        <!-- Small controls inserted next to the back button. One variant for mobile, another for md+ -->
        <div v-if="$slots['back-extra']" class="ml-2 md:hidden px-3 py-0 flex items-center gap-2">
          <slot name="back-extra" />
        </div>
      </div>
      <div v-if="title || subtitle || $slots['actions']" class="flex items-center flex-1" :class="classAdd">
        <div class="flex flex-row items-center gap-4">
          <div>
            <h1 class="mt-1 text-base md:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
              <UIcon v-if="icon" :name="icon" class="text-secondary mr-3 text-2xl" />
              {{ title }}
            </h1>
            <p v-if="subtitle" class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ subtitle }}</p>
          </div>
        
        </div>
        <slot name="actions"></slot>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserRole } from '~/composables/auth/useUserRole'
import { ROLES } from '~/constants/roles'

const { currentRole } = useUserRole()

interface Props {
  title?: string
  subtitle?: string
  icon?: string|null
  loading?: boolean
  hideBackButton?: boolean
  classAdd?: string
  
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  icon: null,
  loading: false,
  hideBackButton: true,
  classAdd: 'justify-between',
})
defineEmits<{
  back: []
  save: []
}>()
</script> 