<template>
  <div>
    <DynamicModal
      v-for="modal in modals"
      :key="modal.id"
      :modal="modal"
      :visible="true"
      @close="removeModal(modal.id)"
    />
  </div>
</template>

<script setup lang="ts">
const { modals, removeModal } = useModal()
</script> 