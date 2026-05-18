<template>
  <UModal v-model:open="abierto" :ui="{ content: 'max-w-md' }">
    <template #content>
      <div class="flex max-h-[min(90dvh,640px)] flex-col bg-default">
        <div class="flex shrink-0 items-center gap-3 border-b border-default px-4 py-3">
          <UButton
            icon="i-heroicons-x-mark"
            color="primary"
            variant="solid"
            size="sm"
            class="rounded-full"
            aria-label="Cerrar"
            @click="abierto = false"
          />
          <h2 class="text-base font-semibold text-highlighted">Info. del mensaje</h2>
        </div>

        <div v-if="loading" class="flex flex-1 items-center justify-center py-16">
          <UIcon name="i-heroicons-arrow-path" class="size-8 animate-spin text-muted" />
        </div>

        <div v-else-if="error" class="p-4 text-sm text-error">{{ error }}</div>

        <div v-else-if="info" class="min-h-0 flex-1 overflow-y-auto">
          <div class="border-b border-default bg-muted/30 px-4 py-4 pattern-chat">
            <div class="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-primary px-3 py-2 text-inverted shadow-sm">
              <p v-if="info.mensaje.texto" class="whitespace-pre-wrap text-[13px]">{{ info.mensaje.texto }}</p>
              <p v-else class="text-[12px] italic opacity-80">Adjunto</p>
              <p class="mt-1 flex items-center justify-end gap-1 text-[10px] text-inverted/70">
                {{ info.entregado_en_fmt }}
                <SoporteTiChatEstadoEnvio
                  v-if="info.mensaje.estadoEnvio"
                  :estado="info.mensaje.estadoEnvio"
                  inverted
                />
              </p>
            </div>
          </div>

          <div class="px-4 py-3">
            <div class="mb-3 flex items-center gap-2 text-sm font-medium text-sky-500">
              <span class="inline-flex -space-x-1.5">
                <UIcon name="i-heroicons-check" class="size-4" />
                <UIcon name="i-heroicons-check" class="size-4 -ms-1.5" />
              </span>
              Leído por
            </div>

            <p v-if="!info.leido_por.length" class="py-6 text-center text-sm text-muted">
              Aún nadie ha leído este mensaje.
            </p>

            <ul v-else class="divide-y divide-default">
              <li
                v-for="row in info.leido_por"
                :key="row.usuario_id"
                class="flex items-center gap-3 py-3"
              >
                <div
                  class="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted"
                >
                  {{ row.iniciales }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-highlighted">~ {{ row.nombre }}</p>
                  <p class="text-xs text-muted">{{ row.leido_en_fmt }}</p>
                </div>
                <p v-if="row.telefono" class="shrink-0 text-xs text-muted tabular-nums">
                  {{ row.telefono }}
                </p>
              </li>
            </ul>

            <p
              v-if="info.destinatarios_count > info.lecturas_count"
              class="mt-4 text-center text-xs text-muted"
            >
              {{ info.lecturas_count }} de {{ info.destinatarios_count }} participantes han leído el mensaje.
            </p>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { SoporteTiService } from '~/services/soporteTiService'
import type { SoporteTiMensajeInfoLectura } from '~/types/soporteTi'
import { mapMensajeApiToUi } from '~/utils/soporteTiMappers'
import SoporteTiChatEstadoEnvio from '~/components/soporte-ti/SoporteTiChatEstadoEnvio.vue'

const props = defineProps<{
  chatUuid: string
  mensajeId: number | null
}>()

const abierto = defineModel<boolean>('open', { default: false })

const loading = ref(false)
const error = ref<string | null>(null)
const info = ref<SoporteTiMensajeInfoLectura | null>(null)

async function cargar() {
  if (!props.chatUuid || !props.mensajeId || !abierto.value) return
  loading.value = true
  error.value = null
  try {
    const res = await SoporteTiService.infoMensaje(props.chatUuid, props.mensajeId)
    if (!res.success || !res.data) throw new Error(res.message || 'No se pudo cargar')
    info.value = {
      ...res.data,
      mensaje: mapMensajeApiToUi(res.data.mensaje)
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar'
    info.value = null
  } finally {
    loading.value = false
  }
}

watch(
  () => [abierto.value, props.mensajeId, props.chatUuid] as const,
  ([open]) => {
    if (open) void cargar()
    else info.value = null
  }
)
</script>

<style scoped>
.pattern-chat {
  background-color: rgb(var(--ui-color-muted) / 0.25);
}
</style>
