<template>
  <div class="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
  :class="modals.length > 0 ? 'z-[9000]' : 'z-[-1]'"
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
import type { ModalData } from '../composables/commons/useModal'

const { modals, removeModal } = useModal()
const confirmingIds = new Set<string>()

const handleConfirm = async (modal: ModalData) => {
  if (confirmingIds.has(modal.id)) return
  confirmingIds.add(modal.id)
  removeModal(modal.id)
  try {
    if (modal.onConfirm) {
      await modal.onConfirm()
    }
  } finally {
    confirmingIds.delete(modal.id)
  }
}
const handleCancel = (modal: ModalData) => {
  if (modal.onCancel) {
    modal.onCancel()
  }
  removeModal(modal.id)
}
</script> 