<template>
  <UModal v-model:open="abierto" :ui="{ content: 'sm:max-w-4xl' }">
    <template #header>
      <div class="flex w-full items-center justify-between gap-2">
        <h2 class="text-base font-semibold text-highlighted">Exportar ticket {{ codigoTicket }}</h2>
        <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" size="sm" @click="abierto = false" />
      </div>
    </template>

    <template #body>
      <div v-if="cargando" class="flex items-center justify-center gap-2 py-10 text-sm text-muted">
        <UIcon name="i-heroicons-arrow-path" class="size-4 animate-spin" />
        Generando exportación…
      </div>

      <UAlert v-else-if="error" color="error" variant="subtle" icon="i-heroicons-exclamation-triangle" :title="error" />

      <div v-else-if="exportacion" class="space-y-3">
        <dl class="grid grid-cols-2 gap-3 rounded-lg bg-elevated p-3 text-xs sm:grid-cols-4">
          <div>
            <dt class="text-muted">Desde el principio</dt>
            <dd class="font-medium text-highlighted">{{ fechaCorta(exportacion.desde) }}</dd>
          </div>
          <div>
            <dt class="text-muted">Último mensaje</dt>
            <dd class="font-medium text-highlighted">{{ fechaCorta(exportacion.hasta) }}</dd>
          </div>
          <div>
            <dt class="text-muted">Mensajes</dt>
            <dd class="font-medium text-highlighted">{{ exportacion.total_mensajes }}</dd>
          </div>
          <div>
            <dt class="text-muted">Adjuntos</dt>
            <dd class="font-medium text-highlighted">{{ exportacion.total_adjuntos }}</dd>
          </div>
        </dl>
        <p class="text-[11px] text-muted">Exportado el {{ exportacion.generado_en }} (hora de Lima).</p>
        <textarea
          readonly
          :value="exportacion.texto"
          class="h-[55vh] w-full resize-none rounded-lg border border-default bg-default p-3 font-mono text-xs leading-relaxed text-default focus:outline-none"
          @focus="($event.target as HTMLTextAreaElement).select()"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="outline" @click="abierto = false">Cerrar</UButton>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-heroicons-arrow-down-tray"
          :disabled="!exportacion"
          @click="descargar"
        >
          Descargar .txt
        </UButton>
        <UButton icon="i-heroicons-clipboard-document" :disabled="!exportacion" @click="void onCopiar()">
          {{ copiado ? 'Copiado' : 'Copiar todo' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useModal } from '~/composables/commons/useModal'
import { useSoporteTiExportar } from '~/composables/useSoporteTiExportar'

const props = defineProps<{ solicitudId: number; codigoTicket: string }>()
const abierto = defineModel<boolean>('open', { default: false })

const { showError } = useModal()
const { cargando, error, exportacion, copiado, cargar, copiar, descargar } = useSoporteTiExportar()

watch(abierto, (v) => {
  if (v) void cargar(props.solicitudId)
})

async function onCopiar() {
  const ok = await copiar()
  if (!ok) showError('Copiar', 'No se pudo copiar. Selecciona el texto y cópialo a mano.')
}

function fechaCorta(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('es-PE', { timeZone: 'America/Lima', hour12: false })
}
</script>
