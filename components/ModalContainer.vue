<template>
  <div class="fixed inset-0 flex items-center justify-center p-4"
  :class="[
    modals.length > 0 ? 'z-[9000]' : 'z-[-1]',
    'pointer-events-auto'
  ]"
  >
    
    <DynamicModal
      v-for="modal in modals"
      :key="modal.id"
      :modal="modal"
      :visible="true"
      @close="removeModal(modal.id)"
      @confirm="handleConfirm(modal)"
      @cancel="handleCancel(modal)"
    />
  </div>
</template>

<script setup lang="ts">
import { useModal } from '../composables/commons/useModal'
const { modals, removeModal } = useModal()

const handleConfirm = (modal: any) => {
  if (modal.onConfirm) {
    modal.onConfirm()
  }
  removeModal(modal.id)
}
const handleCancel = (modal: any) => {
  if (modal.onCancel) {
    modal.onCancel()
  }
  removeModal(modal.id)
}
</script> 