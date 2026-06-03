<template>
  <div class="border-t border-default bg-elevated/40 px-3 py-2">
    <div class="mb-1.5 flex items-center justify-between gap-2">
      <span class="text-xs font-semibold uppercase tracking-wide text-muted">Plantillas</span>
      <UButton
        v-if="templates.length"
        size="xs"
        color="primary"
        variant="link"
        label="Ver todas"
        @click="emit('open-modal')"
      />
    </div>

    <p v-if="loading" class="text-xs text-muted">Cargando plantillas…</p>
    <p v-else-if="!templates.length" class="text-xs text-muted">
      No hay plantillas. Revisa la conexión con Meta o actualiza el inbox.
    </p>
    <div v-else class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
      <UButton
        v-for="tpl in templates"
        :key="tpl.name"
        size="xs"
        variant="outline"
        color="neutral"
        class="shrink-0 max-w-[220px]"
        :label="tpl.label || tpl.name"
        :title="tpl.text"
        @click="emit('select', tpl)"
      />
    </div>
    <p v-if="!loading && templates.length && windowOpen" class="mt-1 text-[10px] text-muted">
      Disponibles con la ventana abierta o cerrada.
    </p>
  </div>
</template>

<script setup lang="ts">
import type { WaInboxTemplate } from '~/types/whatsapp-inbox'

defineProps<{
  templates: WaInboxTemplate[]
  loading?: boolean
  /** Ventana 24h abierta o en aviso (no cerrada) */
  windowOpen?: boolean
}>()

const emit = defineEmits<{
  'open-modal': []
  select: [tpl: WaInboxTemplate]
}>()
</script>
