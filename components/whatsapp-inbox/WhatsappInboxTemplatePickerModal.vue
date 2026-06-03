<template>
  <UModal v-model:open="open" title="Plantillas de WhatsApp" :ui="{ width: 'sm:max-w-lg' }">
    <template #body>
      <div class="max-h-[60vh] space-y-3 overflow-y-auto">
        <p v-if="loading" class="py-6 text-center text-sm text-muted">Cargando plantillas…</p>
        <p v-else-if="!templates.length" class="py-6 text-center text-sm text-muted">
          No hay plantillas disponibles.
        </p>
        <button
          v-for="tpl in templates"
          :key="tpl.name"
          type="button"
          class="w-full text-left"
          @click="onPick(tpl)"
        >
          <UCard variant="outline" color="neutral" :ui="{ body: 'p-3 sm:p-3' }">
            <p class="text-sm font-semibold text-primary">{{ tpl.label || tpl.name }}</p>
            <p class="mt-1 line-clamp-2 text-xs text-muted">{{ tpl.text }}</p>
            <p
              v-if="getTemplateParamDefs(tpl).length"
              class="mt-2 text-[10px] text-muted"
            >
              {{ getTemplateParamDefs(tpl).length }} parámetro(s)
            </p>
          </UCard>
        </button>
      </div>
    </template>
    <template #footer>
      <UButton color="neutral" variant="ghost" label="Cerrar" @click="open = false" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { WaInboxTemplate } from '~/types/whatsapp-inbox'
import { getTemplateParamDefs } from '~/utils/whatsappInboxTemplateParams'

const open = defineModel<boolean>('open', { default: false })

defineProps<{
  templates: WaInboxTemplate[]
  loading?: boolean
}>()

const emit = defineEmits<{
  select: [tpl: WaInboxTemplate]
}>()

function onPick(tpl: WaInboxTemplate) {
  open.value = false
  emit('select', tpl)
}
</script>
