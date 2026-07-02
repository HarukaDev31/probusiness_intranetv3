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
            <p class="flex flex-wrap items-center gap-2 text-sm font-semibold text-primary">
              <span>{{ tpl.label || tpl.name }}</span>
              <UBadge
                v-if="tpl.header_format"
                color="warning"
                variant="subtle"
                size="xs"
                :label="`Encabezado ${tpl.header_format}`"
              />
            </p>
            <p class="mt-1 line-clamp-2 text-xs text-muted">{{ tpl.text }}</p>
            <div v-if="getTemplateParamDefs(tpl).length" class="mt-2 space-y-1.5">
              <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Parámetros
              </p>
              <ul class="flex flex-wrap gap-1.5">
                <li
                  v-for="def in getTemplateParamDefs(tpl)"
                  :key="def.name"
                  class="inline-flex max-w-full items-center gap-1 rounded-md border border-default bg-elevated/60 px-1.5 py-0.5"
                >
                  <span class="truncate text-[10px] font-medium text-highlighted">
                    {{ def.label || def.name }}
                  </span>
                  <UBadge
                    :color="paramTypeBadgeColor(def)"
                    variant="subtle"
                    size="xs"
                    :label="paramTypeLabel(def)"
                  />
                </li>
              </ul>
            </div>
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
import {
  getTemplateParamDefs,
  paramTypeBadgeColor,
  paramTypeLabel
} from '~/utils/whatsappInboxTemplateParams'

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
