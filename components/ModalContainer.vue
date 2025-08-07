<template>
  <div>
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