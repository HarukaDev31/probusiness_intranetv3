<template>
  <UModal
    :open="open"
    :title="title"
    :description="description || undefined"
    :dismissible="true"
    :ui="{
      content: 'w-full max-w-4xl sm:max-w-4xl',
      header: 'border-t-[5px] border-t-primary-500',
      title: 'text-lg font-bold text-highlighted',
      description: 'text-sm text-muted'
    }"
    @update:open="onOpen"
  >
    <template #body>
      <VoucherViewer :url="url" :name="name" />
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton v-if="url" :to="url" target="_blank" rel="noopener" color="neutral" variant="outline" icon="i-heroicons-arrow-down-tray" title="Descargar">
          Descargar
        </UButton>
        <UButton color="neutral" variant="soft" @click="emit('close')">Cerrar</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import VoucherViewer from '~/components/pago-proveedor/VoucherViewer.vue'

withDefaults(defineProps<{
  open: boolean
  url: string | null
  name?: string | null
  title?: string
  description?: string | null
}>(), {
  name: null,
  title: 'Comprobante',
  description: null
})

const emit = defineEmits<{ close: [] }>()

function onOpen(value: boolean) {
  if (!value) emit('close')
}
</script>
